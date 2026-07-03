package atavism.agis.objects;

import java.util.HashMap;
import java.util.Map;

import atavism.agis.core.Agis;
import atavism.agis.plugins.ClassAbilityPlugin;
import atavism.agis.util.EventMessageHelper;
import atavism.agis.util.RequirementCheckResult;
import atavism.server.util.Log;

/**
 * WotLK-style talent tree validation: tier gates per tree, total point pool, optional exclusive groups.
 */
public final class TalentTreeHelper {

	private TalentTreeHelper() {
	}

	public static int getPointsSpentInTree(SkillInfo skillInfo, int treeId) {
		if (treeId < 0 || skillInfo == null) {
			return 0;
		}
		int spent = 0;
		for (SkillData skillData : skillInfo.getSkills().values()) {
			if (!skillData.getTalent() || skillData.getSkillLevel() <= 0) {
				continue;
			}
			SkillTemplate tmpl = Agis.SkillManager.get(skillData.getSkillID());
			if (tmpl == null || tmpl.getTreeId() != treeId) {
				continue;
			}
			spent += skillData.getSkillLevel() * Math.max(1, tmpl.getSkillPointCost());
		}
		return spent;
	}

	public static int getTreePointsAfterIncrease(SkillInfo skillInfo, SkillTemplate template, int additionalRanks) {
		int treeId = template.getTreeId();
		if (treeId < 0) {
			return 0;
		}
		int cost = Math.max(1, template.getSkillPointCost()) * additionalRanks;
		return getPointsSpentInTree(skillInfo, treeId) + cost;
	}

	public static SkillTemplate findExclusiveConflict(SkillInfo skillInfo, SkillTemplate template) {
		int group = template.getExclusiveGroup();
		if (group <= 0 || !template.isTalent()) {
			return null;
		}
		for (SkillData skillData : skillInfo.getSkills().values()) {
			if (!skillData.getTalent() || skillData.getSkillLevel() <= 0) {
				continue;
			}
			if (skillData.getSkillID() == template.getSkillID()) {
				continue;
			}
			SkillTemplate other = Agis.SkillManager.get(skillData.getSkillID());
			if (other == null) {
				continue;
			}
			if (other.getExclusiveGroup() == group && other.getTreeId() == template.getTreeId()) {
				return other;
			}
		}
		return null;
	}

	public static int getRequiredTreePoints(SkillTemplate template) {
		if (template.getTreePointsRequired() > 0) {
			return template.getTreePointsRequired();
		}
		// WotLK default: tier 1 = 0, tier 2 = 5, tier 3 = 10, ...
		if (template.getTier() > 1 && ClassAbilityPlugin.TALENT_TIER_POINT_STEP > 0) {
			return (template.getTier() - 1) * ClassAbilityPlugin.TALENT_TIER_POINT_STEP;
		}
		return 0;
	}

	public static boolean checkTalentTreeRequirements(SkillInfo skillInfo, CombatInfo info, SkillTemplate template) {
		if (!template.isTalent()) {
			return true;
		}

		int treeId = template.getTreeId();
		int requiredTreePoints = getRequiredTreePoints(template);
		if (treeId >= 0 && requiredTreePoints > 0) {
			int spent = getPointsSpentInTree(skillInfo, treeId);
			if (spent < requiredTreePoints) {
				EventMessageHelper.SendRequirementFailedEvent(info.getOwnerOid(),
						new RequirementCheckResult(RequirementCheckResult.RESULT_TALENT_TREE_POINTS_TOO_LOW, treeId,
								"" + requiredTreePoints));
				return false;
			}
		}

		// WotLK: total earned points cap across ALL trees (e.g. 71 at level 80), not per-tree.
		int playerLevel = info.statGetCurrentValue("level");
		int maxTotal = calculateTalentPointsForLevel(playerLevel) + skillInfo.getBoughtTalentPoints();
		int projectedTotal = recalculateTalentPointsSpent(skillInfo)
				+ Math.max(1, template.getSkillPointCost());
		if (projectedTotal > maxTotal) {
			EventMessageHelper.SendRequirementFailedEvent(info.getOwnerOid(),
					new RequirementCheckResult(RequirementCheckResult.RESULT_TALENT_TREE_MAX_REACHED, -1,
							"" + maxTotal));
			return false;
		}

		if (ClassAbilityPlugin.TALENT_EXCLUSIVE_GROUPS_ENABLED) {
			SkillTemplate conflict = findExclusiveConflict(skillInfo, template);
			if (conflict != null) {
				EventMessageHelper.SendRequirementFailedEvent(info.getOwnerOid(),
						new RequirementCheckResult(RequirementCheckResult.RESULT_TALENT_EXCLUSIVE_CONFLICT,
								conflict.getSkillID(), conflict.getSkillName()));
				return false;
			}
		}

		return true;
	}

	public static int calculateTalentPointsForLevel(int level) {
		if (ClassAbilityPlugin.TALENT_POINTS_START_LEVEL > 1) {
			int levelsWithPoints = Math.max(0, level - ClassAbilityPlugin.TALENT_POINTS_START_LEVEL + 1);
			return levelsWithPoints * ClassAbilityPlugin.TALENT_POINTS_PER_LEVEL;
		}
		return Math.max(0, level - 1) * ClassAbilityPlugin.TALENT_POINTS_GIVEN_PER_LEVEL;
	}

	public static int recalculateTalentPointsSpent(SkillInfo skillInfo) {
		int spent = 0;
		for (SkillData skillData : skillInfo.getSkills().values()) {
			if (!skillData.getTalent() || skillData.getSkillLevel() <= 0) {
				continue;
			}
			SkillTemplate tmpl = Agis.SkillManager.get(skillData.getSkillID());
			if (tmpl == null) {
				continue;
			}
			spent += skillData.getSkillLevel() * Math.max(1, tmpl.getSkillPointCost());
		}
		return spent;
	}

	public static HashMap<Integer, Integer> snapshotTalentLevels(SkillInfo skillInfo) {
		HashMap<Integer, Integer> snapshot = new HashMap<>();
		for (SkillData skillData : skillInfo.getSkills().values()) {
			if (skillData.getTalent()) {
				snapshot.put(skillData.getSkillID(), skillData.getSkillLevel());
			}
		}
		return snapshot;
	}

	public static void applyTalentSnapshot(SkillInfo skillInfo, Map<Integer, Integer> snapshot) {
		for (SkillData skillData : skillInfo.getSkills().values()) {
			if (!skillData.getTalent()) {
				continue;
			}
			int level = 0;
			if (snapshot != null && snapshot.containsKey(skillData.getSkillID())) {
				level = snapshot.get(skillData.getSkillID());
			}
			skillData.setSkillLevel(level);
		}
		if (Log.loggingDebug) {
			Log.debug("TalentTreeHelper.applyTalentSnapshot levels=" + snapshot);
		}
	}
}

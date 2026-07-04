package atavism.agis.objects;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import atavism.agis.plugins.ClassAbilityPlugin;
import atavism.server.util.Log;

/**
 * Syncs core class abilities when character level changes (WoW spell book model).
 * Talents remain separate via {@link SkillInfo} talent points.
 */
public final class ClassAbilityByLevelHelper {
    private static final Map<Integer, List<ClassAbilityByLevelEntry>> ENTRIES_BY_ASPECT = new HashMap<>();
    private static boolean enabled = true;

    private ClassAbilityByLevelHelper() {
    }

    public static void setEnabled(boolean value) {
        enabled = value;
    }

    public static boolean isEnabled() {
        return enabled;
    }

    public static void load(Map<Integer, List<ClassAbilityByLevelEntry>> entriesByAspect) {
        ENTRIES_BY_ASPECT.clear();
        if (entriesByAspect == null) {
            return;
        }
        for (Map.Entry<Integer, List<ClassAbilityByLevelEntry>> kv : entriesByAspect.entrySet()) {
            ArrayList<ClassAbilityByLevelEntry> copy = new ArrayList<>(kv.getValue());
            Collections.sort(copy, new Comparator<ClassAbilityByLevelEntry>() {
                @Override
                public int compare(ClassAbilityByLevelEntry a, ClassAbilityByLevelEntry b) {
                    if (a.playerLevel != b.playerLevel) {
                        return Integer.compare(a.playerLevel, b.playerLevel);
                    }
                    return Integer.compare(a.sortOrder, b.sortOrder);
                }
            });
            ENTRIES_BY_ASPECT.put(kv.getKey(), copy);
        }
        if (Log.loggingDebug) {
            Log.debug("ClassAbilityByLevelHelper loaded aspects=" + ENTRIES_BY_ASPECT.size());
        }
    }

    public static List<ClassAbilityByLevelEntry> getEntriesForAspect(int aspect) {
        List<ClassAbilityByLevelEntry> list = ENTRIES_BY_ASPECT.get(aspect);
        return list == null ? Collections.<ClassAbilityByLevelEntry>emptyList() : list;
    }

    /**
     * Called on level change. Learns new spells at/under new level; optionally unlearns on delevel.
     */
    public static void syncOnLevelChange(CombatInfo info, int oldLevel, int newLevel) {
        if (!enabled || info == null) {
            return;
        }
        int aspect = info.aspect();
        List<ClassAbilityByLevelEntry> entries = getEntriesForAspect(aspect);
        if (entries.isEmpty()) {
            return;
        }

        if (newLevel > oldLevel) {
            for (ClassAbilityByLevelEntry entry : entries) {
                if (entry.playerLevel > oldLevel && entry.playerLevel <= newLevel && entry.autoLearn) {
                    SkillInfo.learnAbility(info, entry.abilityId);
                }
            }
        } else if (newLevel < oldLevel && ClassAbilityPlugin.LOST_LEVEL) {
            for (ClassAbilityByLevelEntry entry : entries) {
                if (entry.playerLevel > newLevel && entry.playerLevel <= oldLevel && entry.unlearnOnDelevel) {
                    SkillInfo.unlearnAbility(info, entry.abilityId);
                }
            }
        }
    }

    /**
     * Ensures all class spells for current level are known (login / reload).
     */
    public static void syncOnLogin(CombatInfo info) {
        if (!enabled || info == null) {
            return;
        }
        int level = (int) info.statGetCurrentValue(ClassAbilityPlugin.LEVEL_STAT);
        int aspect = info.aspect();
        List<ClassAbilityByLevelEntry> entries = getEntriesForAspect(aspect);
        for (ClassAbilityByLevelEntry entry : entries) {
            if (entry.playerLevel <= level && entry.autoLearn) {
                SkillInfo.learnAbility(info, entry.abilityId);
            }
        }
    }

    /**
     * Returns ability IDs the player should know at this level (for tests / tooling).
     */
    public static List<Integer> expectedAbilityIds(int aspect, int playerLevel) {
        ArrayList<Integer> ids = new ArrayList<>();
        for (ClassAbilityByLevelEntry entry : getEntriesForAspect(aspect)) {
            if (entry.playerLevel <= playerLevel && entry.autoLearn) {
                ids.add(entry.abilityId);
            }
        }
        return ids;
    }

    public static boolean isClassAbility(CombatInfo info, int abilityId) {
        if (info == null) {
            return false;
        }
        for (ClassAbilityByLevelEntry entry : getEntriesForAspect(info.aspect())) {
            if (entry.abilityId == abilityId) {
                return true;
            }
        }
        return false;
    }
}

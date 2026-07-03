using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace WowTalents
{
    /// <summary>
    /// WoW Classic-style talent window: 3 trees, tier rows, exclusive branch rows, dual spec.
    /// Integrates with Atavism Skills singleton when available.
    /// </summary>
    public class WowTalentTreeController : MonoBehaviour
    {
        [Header("UI")]
        public WowTalentTreePanel[] treePanels = new WowTalentTreePanel[3];
        public TMP_Text talentPointsText;
        public TMP_Text treePointsText;
        public Button[] loadoutButtons = new Button[2];
        public Button resetButton;

        [Header("Config")]
        public int playerAspect = 1;
        public string[] treeNames = { "Tree 1", "Tree 2", "Tree 3" };

        readonly Dictionary<int, WowTalentSkillDefinition> _definitions = new();
        readonly Dictionary<int, int> _playerLevels = new();
        int _talentPoints;
        int _totalTalentPointsEarned;
        int _activeLoadout;
        bool _exclusiveGroupsEnabled;
        readonly int[] _treePointsSpent = new int[3];

        void Start()
        {
            if (resetButton != null)
                resetButton.onClick.AddListener(ResetTalents);
            for (int i = 0; i < loadoutButtons.Length; i++)
            {
                int idx = i;
                if (loadoutButtons[i] != null)
                    loadoutButtons[i].onClick.AddListener(() => SwitchLoadout(idx));
            }
            RefreshAll();
        }

        public void LoadDefinitionsFromPrefab(Dictionary<string, object> prefabProps)
        {
            _definitions.Clear();
            int count = prefabProps.ContainsKey("num") ? Convert.ToInt32(prefabProps["num"]) : 0;
            for (int i = 0; i < count; i++)
            {
                var def = WowTalentSkillDefinition.FromPrefab(prefabProps, i);
                if (def.Talent && def.Aspect == playerAspect)
                    _definitions[def.Id] = def;
            }
            BuildTreePanels();
        }

        public void OnSkillsUpdate(Dictionary<string, object> props)
        {
            if (props.ContainsKey("talentPoints"))
                _talentPoints = Convert.ToInt32(props["talentPoints"]);
            if (props.ContainsKey("totalTalentPoints"))
                _totalTalentPointsEarned = Convert.ToInt32(props["totalTalentPoints"]);
            if (props.ContainsKey("activeTalentLoadout"))
                _activeLoadout = Convert.ToInt32(props["activeTalentLoadout"]);
            if (props.ContainsKey("talentExclusiveGroups"))
                _exclusiveGroupsEnabled = Convert.ToBoolean(props["talentExclusiveGroups"]);

            for (int t = 0; t < 3; t++)
            {
                string key = "tree" + t + "PointsSpent";
                if (props.ContainsKey(key))
                    _treePointsSpent[t] = Convert.ToInt32(props[key]);
            }

            _playerLevels.Clear();
            if (props.ContainsKey("numSkills"))
            {
                int n = Convert.ToInt32(props["numSkills"]);
                for (int i = 0; i < n; i++)
                {
                    int id = Convert.ToInt32(props["skill" + i + "ID"]);
                    int level = Convert.ToInt32(props["skill" + i + "Level"]);
                    _playerLevels[id] = level;
                }
            }
            RefreshAll();
        }

        void BuildTreePanels()
        {
            for (int tree = 0; tree < 3; tree++)
            {
                if (tree >= treePanels.Length || treePanels[tree] == null) continue;
                var nodes = _definitions.Values
                    .Where(d => d.TreeId == tree)
                    .OrderBy(d => d.Tier).ThenBy(d => d.Column)
                    .ToList();
                treePanels[tree].Build(tree, treeNames.Length > tree ? treeNames[tree] : "Tree " + (tree + 1), nodes, OnNodeClicked);
            }
        }

        void RefreshAll()
        {
            if (talentPointsText != null)
                talentPointsText.text = "Talent Points: " + _talentPoints + " / " + _totalTalentPointsEarned;

            for (int tree = 0; tree < 3; tree++)
            {
                if (tree >= treePanels.Length || treePanels[tree] == null) continue;
                treePanels[tree].Refresh(_playerLevels, _treePointsSpent[tree],
                    id => CanLearn(id), id => IsExclusiveBlocked(id));
            }

            if (treePointsText != null && treePanels.Length > 0)
                treePointsText.text = "WotLK: total pool shared across trees";

            for (int i = 0; i < loadoutButtons.Length; i++)
            {
                if (loadoutButtons[i] == null) continue;
                var colors = loadoutButtons[i].colors;
                colors.normalColor = i == _activeLoadout ? new Color(0.4f, 0.7f, 1f) : Color.white;
                loadoutButtons[i].colors = colors;
            }
        }

        bool CanLearn(int skillId)
        {
            if (!_definitions.TryGetValue(skillId, out var def)) return false;
            if (_talentPoints < def.PointCost) return false;
            int required = def.TreePointsRequired > 0 ? def.TreePointsRequired
                : (def.Tier > 1 ? (def.Tier - 1) * 5 : 0);
            if (def.TreeId >= 0 && _treePointsSpent[def.TreeId] < required) return false;
            int cur = _playerLevels.ContainsKey(skillId) ? _playerLevels[skillId] : 0;
            if (cur >= def.MaxLevel) return false;
            if (IsExclusiveBlocked(skillId)) return false;
            if (def.ParentSkill > 0)
            {
                int pl = _playerLevels.ContainsKey(def.ParentSkill) ? _playerLevels[def.ParentSkill] : 0;
                if (pl < def.ParentSkillLevelReq) return false;
            }
            if (def.PrereqSkill1 > 0)
            {
                int pl = _playerLevels.ContainsKey(def.PrereqSkill1) ? _playerLevels[def.PrereqSkill1] : 0;
                if (pl < def.PrereqSkill1Level) return false;
            }
            return true;
        }

        /// <summary>
        /// WoW branch choice: another talent in the same exclusive_group already has ranks.
        /// </summary>
        bool IsExclusiveBlocked(int skillId)
        {
            if (!_exclusiveGroupsEnabled) return false;
            if (!_definitions.TryGetValue(skillId, out var def) || def.ExclusiveGroup <= 0)
                return false;

            foreach (var other in _definitions.Values)
            {
                if (other.Id == skillId) continue;
                if (other.ExclusiveGroup != def.ExclusiveGroup || other.TreeId != def.TreeId) continue;
                int lvl = _playerLevels.ContainsKey(other.Id) ? _playerLevels[other.Id] : 0;
                if (lvl > 0) return true;
            }
            return false;
        }

        void OnNodeClicked(int skillId)
        {
            if (!CanLearn(skillId)) return;
            IncreaseSkill(skillId);
        }

        void IncreaseSkill(int skillId)
        {
            // Atavism integration — replace with your project's API if namespace differs
            var skills = FindSkillsInstance();
            if (skills != null)
            {
                skills.SendMessage("IncreaseSkill", skillId, SendMessageOptions.DontRequireReceiver);
            }
            else
            {
                Debug.Log("[WowTalents] IncreaseSkill " + skillId + " — wire Atavism Skills.Instance.IncreaseSkill");
            }
        }

        public void SwitchLoadout(int loadoutIndex)
        {
            var client = FindAtavismClient();
            if (client != null)
            {
                client.SendMessage("SendSwitchTalentLoadout", loadoutIndex, SendMessageOptions.DontRequireReceiver);
            }
            Debug.Log("[WowTalents] Switch loadout " + loadoutIndex);
        }

        public void ResetTalents()
        {
            var skills = FindSkillsInstance();
            if (skills != null)
            {
                skills.SendMessage("ResetSkills", false, SendMessageOptions.DontRequireReceiver);
            }
            Debug.Log("[WowTalents] Reset talents");
        }

        static Component FindSkillsInstance()
        {
            var go = GameObject.Find("Skills");
            return go != null ? go.GetComponent("Skills") : null;
        }

        static Component FindAtavismClient()
        {
            var go = GameObject.Find("AtavismClient");
            return go != null ? go.GetComponent("AtavismClient") : null;
        }
    }
}

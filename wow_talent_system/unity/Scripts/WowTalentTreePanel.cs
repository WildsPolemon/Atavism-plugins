using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace WowTalents
{
    public class WowTalentTreePanel : MonoBehaviour
    {
        public TMP_Text treeTitle;
        public RectTransform rowsContainer;
        public GameObject rowPrefab;
        public GameObject nodePrefab;

        readonly List<WowTalentNodeView> _nodes = new();

        public void Build(int treeId, string title, List<WowTalentSkillDefinition> nodes, Action<int> onClick)
        {
            if (treeTitle != null) treeTitle.text = title;
            foreach (Transform child in rowsContainer)
                Destroy(child.gameObject);
            _nodes.Clear();

            int maxTier = 0;
            foreach (var n in nodes)
                if (n.Tier > maxTier) maxTier = n.Tier;

            var byTier = new Dictionary<int, List<WowTalentSkillDefinition>>();
            foreach (var n in nodes)
            {
                if (!byTier.ContainsKey(n.Tier))
                    byTier[n.Tier] = new List<WowTalentSkillDefinition>();
                byTier[n.Tier].Add(n);
            }

            for (int tier = 1; tier <= maxTier; tier++)
            {
                if (!byTier.ContainsKey(tier)) continue;
                var rowGo = Instantiate(rowPrefab, rowsContainer);
                var rowLayout = rowGo.GetComponent<HorizontalLayoutGroup>();
                var tierNodes = byTier[tier];
                tierNodes.Sort((a, b) => a.Column.CompareTo(b.Column));

                foreach (var def in tierNodes)
                {
                    var nodeGo = Instantiate(nodePrefab, rowGo.transform);
                    var view = nodeGo.GetComponent<WowTalentNodeView>();
                    if (view == null) view = nodeGo.AddComponent<WowTalentNodeView>();
                    view.Setup(def, onClick);
                    _nodes.Add(view);
                }
            }
        }

        public void Refresh(Dictionary<int, int> levels, int treePointsSpent,
            Func<int, bool> canLearn, Func<int, bool> exclusiveBlocked)
        {
            foreach (var node in _nodes)
            {
                int lvl = levels.ContainsKey(node.SkillId) ? levels[node.SkillId] : 0;
                node.Refresh(lvl, canLearn(node.SkillId), exclusiveBlocked(node.SkillId), treePointsSpent);
            }
        }
    }
}

using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace WowTalents
{
    public class WowTalentNodeView : MonoBehaviour
    {
        public Image iconImage;
        public Image frameImage;
        public TMP_Text rankText;
        public Button button;

        public int SkillId { get; private set; }
        WowTalentSkillDefinition _def;
        Action<int> _onClick;

        static readonly Color LockedColor = new Color(0.35f, 0.35f, 0.35f, 1f);
        static readonly Color AvailableColor = new Color(0.85f, 0.75f, 0.2f, 1f);
        static readonly Color MaxedColor = new Color(0.2f, 0.75f, 0.3f, 1f);
        static readonly Color BranchBlockedColor = new Color(0.6f, 0.2f, 0.2f, 1f);

        public void Setup(WowTalentSkillDefinition def, Action<int> onClick)
        {
            _def = def;
            SkillId = def.Id;
            _onClick = onClick;
            if (rankText != null) rankText.text = "0";
            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(() => _onClick?.Invoke(SkillId));
            }
        }

        public void Refresh(int level, bool canLearn, bool exclusiveBlocked, int treePointsSpent)
        {
            if (rankText != null)
                rankText.text = level + "/" + _def.MaxLevel;

            if (frameImage == null) return;

            if (level >= _def.MaxLevel)
                frameImage.color = MaxedColor;
            else if (exclusiveBlocked)
                frameImage.color = BranchBlockedColor;
            else if (canLearn)
                frameImage.color = AvailableColor;
            else if (treePointsSpent < _def.TreePointsRequired)
                frameImage.color = LockedColor;
            else
                frameImage.color = LockedColor;

            if (button != null)
                button.interactable = canLearn && !exclusiveBlocked;
        }
    }
}

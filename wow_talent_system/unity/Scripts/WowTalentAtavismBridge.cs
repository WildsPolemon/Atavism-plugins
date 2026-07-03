using System.Collections.Generic;
using UnityEngine;

namespace WowTalents
{
    /// <summary>
    /// Bridge: subscribe to Atavism skill prefab + runtime skill updates.
    /// Attach next to WowTalentTreeController on your talent window root.
    /// </summary>
    public class WowTalentAtavismBridge : MonoBehaviour
    {
        public WowTalentTreeController controller;

        void OnEnable()
        {
            AtavismEventSystem.RegisterEvent("SKILL_UPDATE", OnSkillUpdate);
            AtavismEventSystem.RegisterEvent("SKILL_PREFAB_UPDATE", OnPrefabUpdate);
        }

        void OnDisable()
        {
            AtavismEventSystem.UnregisterEvent("SKILL_UPDATE", OnSkillUpdate);
            AtavismEventSystem.UnregisterEvent("SKILL_PREFAB_UPDATE", OnPrefabUpdate);
        }

        void OnSkillUpdate(Dictionary<string, object> props)
        {
            if (controller == null) return;
            if (props.ContainsKey("ext_msg_subtype") && props["ext_msg_subtype"].ToString() == "skills")
                controller.OnSkillsUpdate(props);
        }

        void OnPrefabUpdate(Dictionary<string, object> props)
        {
            if (controller == null) return;
            controller.LoadDefinitionsFromPrefab(props);
        }
    }

    /// <summary>
    /// Minimal stub when Atavism event system is not present in editor tests.
    /// Replace with Atavism.AtavismEventSystem in real project.
    /// </summary>
    public static class AtavismEventSystem
    {
        public static void RegisterEvent(string name, System.Action<Dictionary<string, object>> handler) { }
        public static void UnregisterEvent(string name, System.Action<Dictionary<string, object>> handler) { }
    }
}

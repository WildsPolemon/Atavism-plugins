using System;
using System.Collections.Generic;

namespace WowTalents
{
    /// <summary>
    /// Static talent definition from Atavism skill prefab (ServerSkills).
    /// </summary>
    [Serializable]
    public class WowTalentSkillDefinition
    {
        public int Id;
        public string Name;
        public string Icon;
        public bool Talent;
        public int Aspect;
        public int TreeId;
        public int Tier;
        public int Column;
        public int TreePointsRequired;
        public int ExclusiveGroup;
        public int MaxLevel;
        public int PointCost;
        public int ParentSkill;
        public int ParentSkillLevelReq;
        public int PrereqSkill1;
        public int PrereqSkill1Level;
        public int PlayerLevelReq;

        public static WowTalentSkillDefinition FromPrefab(Dictionary<string, object> props, int index)
        {
            string p = "i" + index;
            return new WowTalentSkillDefinition
            {
                Id = GetInt(props, p + "id"),
                Name = GetString(props, p + "name"),
                Icon = GetString(props, p + "icon"),
                Talent = GetBool(props, p + "talent"),
                Aspect = GetInt(props, p + "mAsp"),
                TreeId = GetInt(props, p + "treeId", -1),
                Tier = GetInt(props, p + "tier"),
                Column = GetInt(props, p + "column"),
                TreePointsRequired = GetInt(props, p + "treePtsReq"),
                ExclusiveGroup = GetInt(props, p + "exclGroup"),
                MaxLevel = GetInt(props, p + "maxLev", 5),
                PointCost = GetInt(props, p + "pcost", 1),
                ParentSkill = GetInt(props, p + "pskill", -1),
                ParentSkillLevelReq = GetInt(props, p + "pskilllevreq", 1),
                PrereqSkill1 = GetInt(props, p + "prereq1", -1),
                PrereqSkill1Level = GetInt(props, p + "prereq1lev", 1),
                PlayerLevelReq = GetInt(props, p + "plylevreq", 1),
            };
        }

        static int GetInt(Dictionary<string, object> d, string k, int def = 0)
        {
            if (!d.ContainsKey(k) || d[k] == null) return def;
            return Convert.ToInt32(d[k]);
        }

        static string GetString(Dictionary<string, object> d, string k)
        {
            return d.ContainsKey(k) && d[k] != null ? d[k].ToString() : "";
        }

        static bool GetBool(Dictionary<string, object> d, string k)
        {
            if (!d.ContainsKey(k) || d[k] == null) return false;
            return Convert.ToBoolean(d[k]);
        }
    }
}

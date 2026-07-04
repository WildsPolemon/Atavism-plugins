package atavism.agis.objects;

import java.io.Serializable;

/**
 * WoW-style class spell granted at a specific character level (independent of talent points).
 */
public class ClassAbilityByLevelEntry implements Serializable {
    public int id;
    public int aspect;
    public int playerLevel;
    public int abilityId;
    public boolean autoLearn = true;
    public boolean unlearnOnDelevel = true;
    public int sortOrder;

    public ClassAbilityByLevelEntry(int id, int aspect, int playerLevel, int abilityId,
            boolean autoLearn, boolean unlearnOnDelevel, int sortOrder) {
        this.id = id;
        this.aspect = aspect;
        this.playerLevel = playerLevel;
        this.abilityId = abilityId;
        this.autoLearn = autoLearn;
        this.unlearnOnDelevel = unlearnOnDelevel;
        this.sortOrder = sortOrder;
    }
}

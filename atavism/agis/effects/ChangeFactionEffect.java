package atavism.agis.effects;

import atavism.agis.core.AgisEffect;
import atavism.agis.objects.CombatInfo;
import atavism.agis.objects.PlayerFactionData;
import atavism.agis.plugins.CombatClient;
import atavism.agis.plugins.FactionClient;
import atavism.agis.plugins.GuildPlugin;
import atavism.agis.util.EventMessageHelper;
import atavism.agis.util.ExtendedCombatMessages;
import atavism.server.engine.Engine;
import atavism.server.engine.EnginePlugin;
import atavism.server.engine.Namespace;
import atavism.server.engine.OID;
import atavism.server.plugins.WorldManagerClient;
import atavism.server.util.Log;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * Effect child class that sets the level of reputation for a faction for the player/mob.
 *
 */
public class ChangeFactionEffect extends AgisEffect {

    public ChangeFactionEffect(int id, String name) {
    	super(id, name);
    	isPeriodic(false);
    	isPersistent(false);
    }
    
    // add the effect to the object
    public void apply(EffectState state) {
    	super.apply(state);
    	Map<String, Serializable> params = state.getParams();
		if (Log.loggingDebug)
			Log.debug("ChangeFactionEffect: apply effect params is: " + params);
		int claimID = -1;
		int objectID = -1;
			if (params.containsKey("claimID"))
			claimID = (int) params.get("claimID");
		if (params.containsKey("objectID"))
			objectID = (int) params.get("objectID");
		if (claimID > 0 && objectID > 0) {
			Log.debug("ChangeFactionEffect: this effect is not for buildings");
			state.wasApplied(false);
			return;
		}	
		Log.debug("ChangeFactionEffect: applying faction alteration for faction: " + faction);
    	//CombatInfo caster = state.getCaster();
    	CombatInfo target = state.getTarget();
    	
    	if ( faction == -1) {
    		Log.debug("ChangeFactionEffect: rep value or name has not been set. Effect name: " + effectName);
			state.wasApplied(false);
    		return;
    	}

		int targetGuild = -1;
		try {
			targetGuild = (Integer) EnginePlugin.getObjectProperty(target.getOid(), WorldManagerClient.NAMESPACE, GuildPlugin.GUILD_PROP);
		} catch (NullPointerException e1) {
		}
		if ( targetGuild > 0) {
			Log.debug("ChangeFactionEffect: player "+target.getOid()+" is in guild. effect cant be applied " + effectName);
			ExtendedCombatMessages.sendErrorMessage(target.getOid(), "CantChangeFactionInGuild");
			state.wasApplied(false);
			return;
		}
		state.wasApplied();

		FactionClient.alterFaction(target.getOid(), faction);


    	Log.debug("ChangeFactionEffect: applied faction alteration for faction: " + faction);
    }

    // remove the effect from the object
    public void remove(EffectState state) {
    	Log.debug("ChangeFactionEffect: removing faction alteration for faction: " + faction);
		CombatInfo target = state.getTarget();
		// We need to go through each effect the player has on them and see if they have a PropertyEffect with
		// the same property name. If they do, we need to check priorities and get the one with the highest priority.

		super.remove(state);
		Log.debug("ChangeFactionEffect: removed faction alteration for faction: " + faction);
    }

    // perform the next periodic pulse for this effect on the object
    public void pulse(EffectState state) {
    	super.pulse(state);
    }
    
    protected int faction = -1;
//    protected int repValue = -1;
//    protected int repDefault = -1;
    protected int priority = 0;
	protected boolean changeDefaultFaction = false;
	protected boolean restoreFaction = false;

//	public void setChangeDefaultFaction(boolean changeDefaultFaction) {
//		this.changeDefaultFaction = changeDefaultFaction;
//	}
//
//	public boolean isChangeDefaultFaction() {
//		return changeDefaultFaction;
//	}
//
//	public void setRestoreFaction(boolean restoreFaction) {
//		this.restoreFaction = restoreFaction;
//	}
//
//	public boolean isRestoreFaction() {
//		return restoreFaction;
//	}

	public void setFaction(int factionID) { faction = factionID;}
    public int getFaction() {return faction;}
//    public void setRepValue(int value) {repValue = value;}
//    public int getRepValue() {return repValue;}
//    public void setRepDefault(int defaultValue) {repDefault = defaultValue;}
//    public int getRepDefault() {return repDefault;}
    public void setPriority(int priority) {this.priority = priority;}
    public int getPriority() {return priority;}
    
    // Effect Value that needs to be removed upon effect removal
    public void setEffectVal(int effect) {
    	effectVal = effect;
    }
    public int GetEffectVal() {
        return effectVal;
    }
    public int effectVal = 0;
    
    public void setEffectName(String eName) {
    	effectName = eName;
    }
    public String getEffectName() {
    	return effectName;
    }
    protected String effectName = "";
    
    public void setEffectType(int type) {
    	effectType = type;
    }
    public int GetEffectType() {
        return effectType;
    }
    public int effectType = 0;
    
    private static final long serialVersionUID = 1L;
}
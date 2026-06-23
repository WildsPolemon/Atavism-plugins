package atavism.agis.objects;

import atavism.agis.core.AgisEffect;
import atavism.server.objects.*;
import atavism.server.engine.*;
import atavism.server.util.Log;

import java.beans.BeanInfo;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


/**
 * Information related to the combat system. Any object that wants to be involved
 * in combat needs one of these.
 */
public class FactionStateInfo extends Entity {
	public FactionStateInfo() {
		super();
		setNamespace(Namespace.FACTION);
	}

	public FactionStateInfo(OID objOid) {
		super(objOid);
		setNamespace(Namespace.FACTION);
	}

    public String toString() {
        return "[FactionStateInfo: " + getName() + ":" + getOid() + "]";
    }
 
    public boolean isPlayer() {
    	return getBooleanProperty("isPlayer");
    }
    public void isPlayer(boolean isPlayer) {
    	setProperty("isPlayer", isPlayer);
    }
    public boolean isPet() {
    	return getBooleanProperty("pet");
    }
    public void isPet(boolean isPet) {
    	setProperty("pet", isPet);
    }
    
    protected int aggroRadius = 17;
    public void setAggroRadius(int radius) {
    	aggroRadius = radius;
    }
    public int getAggroRadius() {
    	return aggroRadius;
    }
    
    
    public boolean isDead() {
    	Boolean isDead = (Boolean) getBooleanProperty("isDead");
    	if (isDead == null) {
    		isDead = false;
    	}
    	return isDead;
    }
    public void isDead(boolean isDead) {
    	setProperty("isDead", isDead);
    }


	public Map<OID, PvpInfo> getPvpData() {
		return pvpData;
	}

	public PvpInfo getPvpData(OID oid) {
		return pvpData.get(oid);
	}

	public void setPvpData(Map<OID, PvpInfo> pvpData) {
		this.pvpData = pvpData;
	}

	//public HashMap<String, PvpInfo> getPvpDataRef() { return new HashMap<String, PvpInfo>(pvpData); }
	transient Map<OID , PvpInfo> pvpData = new ConcurrentHashMap<OID, PvpInfo>();


	@SuppressWarnings("unchecked")
	public Object clone() throws CloneNotSupportedException {
		lock.lock();
		try {
			FactionStateInfo it =  (FactionStateInfo)super.clone();
			return it;
		} finally {
			lock.unlock();
		}
	}

	/*
	 * Final Static properties
	 */
	public static final String FACTION_PROP = "faction";
	public static final String IN_PVP_PROP = "inPvp";
	public static final String AGGRO_RADIUS = ":aggroRadius";
	public static final String TEMPORARY_FACTION_PROP = "temporaryFaction";

	public static final String PET_FACTION_PROP = "petFaction";
	public static final String ARENA_FACTION_PROP = "arenaFaction";
	public static final String DUEL_FACTION_PROP = "duelFaction";

	public static final String PVP_GUILD_FACTION_PROP = "pvpGuildFaction";
	public static final String PVP_GROUP_FACTION_PROP = "pvpGroupFaction";
	public static final String PVP_FACTION_PROP = "pvpFaction";
	public static final String PVP_MODE_PROP = "pvpMode";
	public static final String PVP_RANK_PROP = "pvpRank";

	public static final String PVP_SANCTUARY_FACTION_PROP = "pvpSanctuaryFaction";


	static {
		try {
			BeanInfo info = Introspector.getBeanInfo(FactionStateInfo.class);
			PropertyDescriptor[] propertyDescriptors = info.getPropertyDescriptors();
			for (int i = 0; i < propertyDescriptors.length; ++i) {
				PropertyDescriptor pd = propertyDescriptors[i];
				if (pd.getName().equals("pvpData")) {
					pd.setValue("transient", Boolean.TRUE);
				}
				//log.debug("BeanInfo name="+pd.getName());
			}
		} catch (Exception e) {
			Log.error("failed beans initalization");
		}
	}


	private static final long serialVersionUID = 1L;
}

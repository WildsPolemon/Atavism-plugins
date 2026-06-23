package atavism.agis.objects;

import atavism.server.engine.OID;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class PvpInfo  implements Serializable {
    public boolean  isGuild;
    public boolean  isGroup;
    public boolean  isSanctuary;
    public boolean  isAutoEnterPVP;
    // 0: Faction base , 1: Outlaw, 2: Chaotic
    public int mode = -1;
    public OID regionOID;
    public OID regionInstaceOID;
    public List<Integer> sanctuaryFactions = new ArrayList<>();
    public List<List<Integer>> factionsGroups = new ArrayList<>();
    public int getFactionGroup(int faction) {
        for (int i=0; i< factionsGroups.size(); i++) {
            if (factionsGroups.get(i).contains(faction)) {
                return i;
            }
        }
        return -1;
    }

    @Override
    public String toString() {
        return "[PvpInfo: regionOID:"+regionOID+" regionInstaceOID:"+regionInstaceOID+" mode:"+mode+" isGuild:"+isGuild+" isGroup:"+isGroup+" isSanctuary:"+isSanctuary+" isAutoEnterPVP:"+isAutoEnterPVP+" factionsGroups:"+factionsGroups+" sanctuaryFactions:"+sanctuaryFactions+"]";
    }
}

package atavism.agis.objects;

import atavism.agis.database.CombatDatabase;
import atavism.agis.plugins.CombatPlugin;
import atavism.server.util.Log;

/**
 * WotLK-inspired combat rules layered on top of AGIS generic stats/cooldowns.
 * Enable with game setting {@code WOW_COMBAT_ENABLED=true}.
 */
public final class WoWCombatHelper {

    public static final int INTERCEPT_ON_NEXT_SWING = 2;

    public static boolean ENABLED = false;
    public static String RAGE_STAT = "rage";
    public static String MANA_STAT = "mana";
    public static float RAGE_GEN_DEALT_DIVISOR = 7.5f;
    public static float RAGE_GEN_TAKEN_DIVISOR = 2.5f;
    public static int RAGE_OOC_DECAY = 1;
    public static long MANA_FIVE_SECOND_RULE_MS = 5000L;
    public static float WOW_GLOBAL_COOLDOWN = 1.5f;

    private WoWCombatHelper() {}

    public static boolean isEnabled() {
        return ENABLED;
    }

    public static void loadSettings(CombatDatabase cDB) {
        String enabled = cDB.loadGameSetting("WOW_COMBAT_ENABLED");
        if (enabled != null) {
            ENABLED = Boolean.parseBoolean(enabled);
        }
        String rageStat = cDB.loadGameSetting("WOW_RAGE_STAT");
        if (rageStat != null && !rageStat.isEmpty()) {
            RAGE_STAT = rageStat;
        }
        String manaStat = cDB.loadGameSetting("WOW_MANA_STAT");
        if (manaStat != null && !manaStat.isEmpty()) {
            MANA_STAT = manaStat;
        }
        String dealt = cDB.loadGameSetting("WOW_RAGE_GEN_DEALT_DIVISOR");
        if (dealt != null) {
            RAGE_GEN_DEALT_DIVISOR = Float.parseFloat(dealt);
        }
        String taken = cDB.loadGameSetting("WOW_RAGE_GEN_TAKEN_DIVISOR");
        if (taken != null) {
            RAGE_GEN_TAKEN_DIVISOR = Float.parseFloat(taken);
        }
        String decay = cDB.loadGameSetting("WOW_RAGE_OOC_DECAY");
        if (decay != null) {
            RAGE_OOC_DECAY = Integer.parseInt(decay);
        }
        String fiveSec = cDB.loadGameSetting("WOW_MANA_FIVE_SECOND_RULE_MS");
        if (fiveSec != null) {
            MANA_FIVE_SECOND_RULE_MS = Long.parseLong(fiveSec);
        }
        String gcd = cDB.loadGameSetting("WOW_GLOBAL_COOLDOWN");
        if (gcd != null) {
            WOW_GLOBAL_COOLDOWN = Float.parseFloat(gcd);
            CombatPlugin.GLOBAL_COOLDOWN = WOW_GLOBAL_COOLDOWN;
        } else if (ENABLED) {
            CombatPlugin.GLOBAL_COOLDOWN = WOW_GLOBAL_COOLDOWN;
        }
        if (ENABLED) {
            Log.info("WoWCombatHelper: enabled rageStat=" + RAGE_STAT + " gcd=" + CombatPlugin.GLOBAL_COOLDOWN);
        }
    }

    public static boolean isOnNextSwing(int interceptType) {
        return interceptType == INTERCEPT_ON_NEXT_SWING;
    }

    public static boolean isRageStat(String statName) {
        return statName != null && statName.equalsIgnoreCase(RAGE_STAT);
    }

    public static boolean isManaStat(String statName) {
        return statName != null && statName.equalsIgnoreCase(MANA_STAT);
    }

    public static void onResourceSpent(CombatInfo info, String statName) {
        if (!ENABLED || info == null || statName == null) {
            return;
        }
        if (isManaStat(statName)) {
            info.setProperty(CombatInfo.COMBAT_PROP_LAST_MANA_SPEND, System.currentTimeMillis());
        }
    }

    public static boolean isInFiveSecondRule(CombatInfo info) {
        if (!ENABLED || info == null) {
            return false;
        }
        Object lastSpend = info.getProperty(CombatInfo.COMBAT_PROP_LAST_MANA_SPEND);
        if (!(lastSpend instanceof Long)) {
            return false;
        }
        return System.currentTimeMillis() - (Long) lastSpend < MANA_FIVE_SECOND_RULE_MS;
    }

    public static void addRageFromDamageDealt(CombatInfo attacker, int damage) {
        if (!ENABLED || attacker == null || damage <= 0 || !attacker.isUser()) {
            return;
        }
        if (!hasStat(attacker, RAGE_STAT)) {
            return;
        }
        int rage = Math.max(1, Math.round(damage / RAGE_GEN_DEALT_DIVISOR));
        grantRage(attacker, rage);
    }

    public static void addRageFromDamageTaken(CombatInfo defender, int damage) {
        if (!ENABLED || defender == null || damage <= 0 || !defender.isUser()) {
            return;
        }
        if (!hasStat(defender, RAGE_STAT)) {
            return;
        }
        int rage = Math.max(1, Math.round(damage / RAGE_GEN_TAKEN_DIVISOR));
        grantRage(defender, rage);
    }

    public static void tickRageDecay(CombatInfo info) {
        if (!ENABLED || info == null || !info.isUser() || info.inCombat()) {
            return;
        }
        if (!hasStat(info, RAGE_STAT) || RAGE_OOC_DECAY <= 0) {
            return;
        }
        double current = info.statGetCurrentValueWithPrecision(RAGE_STAT);
        if (current <= 0) {
            return;
        }
        int decay = Math.min(RAGE_OOC_DECAY, (int) Math.ceil(current));
        info.statModifyBaseValue(RAGE_STAT, -decay);
        info.statSendUpdate(false);
    }

    private static void grantRage(CombatInfo info, int amount) {
        double max = info.statGetMaxValue(RAGE_STAT);
        double current = info.statGetCurrentValueWithPrecision(RAGE_STAT);
        if (current >= max) {
            return;
        }
        int grant = (int) Math.min(amount, max - current);
        if (grant > 0) {
            info.statModifyBaseValue(RAGE_STAT, grant);
            info.statSendUpdate(false);
        }
    }

    private static boolean hasStat(CombatInfo info, String statName) {
        try {
            return CombatPlugin.lookupStatDef(statName) != null && info.getProperty(statName) != null;
        } catch (Exception e) {
            return false;
        }
    }
}

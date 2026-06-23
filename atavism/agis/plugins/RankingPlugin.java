package atavism.agis.plugins;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import atavism.agis.database.AccountDatabase;
import atavism.agis.database.AuthDatabase;
import atavism.agis.database.CombatDatabase;
import atavism.agis.database.ContentDatabase;
import atavism.agis.objects.CollectionData;
import atavism.agis.objects.AchievementSetting;
import atavism.agis.objects.Ranking;
import atavism.agis.util.ExtendedCombatMessages;
import atavism.server.plugins.WorldManagerClient;
import atavism.server.plugins.WorldManagerClient.ExtensionMessage;
import atavism.server.plugins.WorldManagerClient.TargetedExtensionMessage;
import atavism.msgsys.*;
import atavism.server.engine.*;
import atavism.server.messages.LoginMessage;
import atavism.server.messages.LogoutMessage;
import atavism.server.util.Log;
import atavism.server.util.Logger;

/**
 * 
 */
public class RankingPlugin extends EnginePlugin {
	public RankingPlugin() {
		super("Ranking");
		setPluginType("Ranking");
	}

	public String getName() {
		return "Ranking";
	}

	public void onActivate() {
		log.debug("RankingPlugin activate");
		registerHooks();
		log.debug("RankingPlugin activate 1");

		MessageTypeFilter filter = new MessageTypeFilter();
		filter.addType(AchievementsClient.MSG_TYPE_RANGING_DATA);
		filter.addType(RankingClient.MSG_TYPE_GET_RANKING);
		filter.addType(RankingClient.MSG_TYPE_GET_RANKING_LIST);
		filter.addType(RankingClient.MSG_TYPE_RESET_PVP_RANKING);
		Engine.getAgent().createSubscription(filter, this);
		log.debug("RankingPlugin activate 2");

		MessageTypeFilter filter2 = new MessageTypeFilter();
		filter2.addType(LoginMessage.MSG_TYPE_LOGIN);
		filter2.addType(LogoutMessage.MSG_TYPE_LOGOUT);
		Engine.getAgent().createSubscription(filter2, this, MessageAgent.RESPONDER);
		log.debug("RankingPlugin activate 3");

		authDB = new AuthDatabase();
		ContentDatabase ctDB = new ContentDatabase(false);
		log.debug("RankingPlugin activate 4");

		String period = ctDB.loadGameSetting("RANKING_CALCULATION_INTERVAL");
		if (period != null) {
			RANKING_CALCULATION_INTERVAL = Integer.parseInt(period);
			Log.debug("Loaded Game Setting RANKING_CALCULATION_INTERVAL=" + RANKING_CALCULATION_INTERVAL);
		}

		String prri = ctDB.loadGameSetting("PVP_RANKING_RESET_INTERVAL");
		if (prri != null) {
			PVP_RANKING_RESET_INTERVAL = Long.parseLong(prri);
			Log.debug("Loaded Game Setting PVP_RANKING_RESET_INTERVAL=" + PVP_RANKING_RESET_INTERVAL);
		}

		String prrst = ctDB.loadGameSetting("PVP_RANKING_RESET_START_TIME");
		if (prrst != null && prrst.length() > 18) {
			PVP_RANKING_RESET_START_TIME = prrst;
			Log.debug("Loaded Game Setting PVP_RANKING_RESET_START_TIME=" + PVP_RANKING_RESET_START_TIME);
		}


		settings = ctDB.GetRankingsSetting();
		//ctDB.close();
		aDB = new AccountDatabase(true);

		long lastRun = aDB.getLastRankingCalculation();
		if (lastRun == 0l) {
			lastRun = RANKING_CALCULATION_INTERVAL;
		} else {
			lastRun = System.currentTimeMillis() - lastRun;
			lastRun = lastRun / 60000;
			if (lastRun < 0)
				lastRun = 0;
			if (lastRun > RANKING_CALCULATION_INTERVAL) {
				lastRun = RANKING_CALCULATION_INTERVAL;
			}
		}
		CombatDatabase cbDB = new CombatDatabase(false);
		CombatPlugin.PVP_RANKS = cbDB.LoadPvpRanks();

		if (Log.loggingDebug)
			log.debug("RankingPlugin lastRun=" + lastRun + " RANKING_CALCULATION_PERIOD=" + RANKING_CALCULATION_INTERVAL);

		//	Engine.registerStatusReportingPlugin(this);
		RankingCalculating rc = new RankingCalculating();
		task = Engine.getExecutor().scheduleAtFixedRate(rc, lastRun, RANKING_CALCULATION_INTERVAL, TimeUnit.MINUTES);

		if (PVP_RANKING_RESET_INTERVAL > 0) {

			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			LocalDateTime dateTime;
			try {
				dateTime = LocalDateTime.parse(PVP_RANKING_RESET_START_TIME, formatter);
			} catch (DateTimeParseException e) {
				log.error("RankingPlugin parse PVP_RANKING_RESET_START_TIME exception " + e);
				dateTime = LocalDateTime.parse("2026-01-01 00:00:00", formatter);
			}
			long timestamp = dateTime
					.atZone(ZoneId.systemDefault())
					.toInstant()
					.toEpochMilli();
			long now = System.currentTimeMillis();
			long interval = PVP_RANKING_RESET_INTERVAL * 3_600_000L;
			long steps = Math.max(0, (now - timestamp + interval - 1) / interval);
			long next = timestamp + steps * interval;
			long nextRun = (next - now);
			ResetPvpRanking rpr = new ResetPvpRanking();
			if (Log.loggingDebug)
				log.debug("RankingPlugin nextRun=" + nextRun + " PVP_RANKING_RESET_INTERVAL=" + PVP_RANKING_RESET_INTERVAL);
			taskReset = Engine.getExecutor().scheduleAtFixedRate(rpr, nextRun, PVP_RANKING_RESET_INTERVAL * 3_600_000L, TimeUnit.MILLISECONDS);
		}

		if (Log.loggingDebug)
			log.debug("RankingPlugin activated");
	}

	protected void ReloadTemplates(Message msg) {
		Log.debug("RankingPlugin ReloadTemplates Start");
		ContentDatabase ctDB = new ContentDatabase(false);
		String period = ctDB.loadGameSetting("RANKING_CALCULATION_INTERVAL");
		if (period != null) {
			RANKING_CALCULATION_INTERVAL = Integer.parseInt(period);
			Log.debug("Loaded Game Setting RANKING_CALCULATION_INTERVAL=" + RANKING_CALCULATION_INTERVAL);
		}

		String prri = ctDB.loadGameSetting("PVP_RANKING_RESET_INTERVAL");
		if (prri != null) {
			PVP_RANKING_RESET_INTERVAL = Long.parseLong(prri);
			Log.debug("Loaded Game Setting PVP_RANKING_RESET_INTERVAL=" + PVP_RANKING_RESET_INTERVAL);
		}

		String prrst = ctDB.loadGameSetting("PVP_RANKING_RESET_START_TIME");
		if (prrst != null && prrst.length() > 18) {
			PVP_RANKING_RESET_START_TIME = prrst;
			Log.debug("Loaded Game Setting PVP_RANKING_RESET_START_TIME=" + PVP_RANKING_RESET_START_TIME);
		}


		settings = ctDB.GetRankingsSetting();
		if(task!=null){
			task.cancel(true);
		}
		if(taskReset!=null){
			taskReset.cancel(true);
		}
		long lastRun = aDB.getLastRankingCalculation();
		if (lastRun == 0l) {
			lastRun = RANKING_CALCULATION_INTERVAL;
		} else {
			lastRun = System.currentTimeMillis() - lastRun;
			lastRun = lastRun / 60000;
			if (lastRun < 0)
				lastRun = 0;
			if (lastRun > RANKING_CALCULATION_INTERVAL) {
				lastRun = RANKING_CALCULATION_INTERVAL;
			}
		}
		CombatDatabase cbDB = new CombatDatabase(false);
		CombatPlugin.PVP_RANKS = cbDB.LoadPvpRanks();

		if (Log.loggingDebug)
			log.debug("RankingPlugin lastRun=" + lastRun + " RANKING_CALCULATION_PERIOD=" + RANKING_CALCULATION_INTERVAL);

		//	Engine.registerStatusReportingPlugin(this);
		RankingCalculating rc = new RankingCalculating();
		task = Engine.getExecutor().scheduleAtFixedRate(rc, lastRun, RANKING_CALCULATION_INTERVAL, TimeUnit.MINUTES);

		if (PVP_RANKING_RESET_INTERVAL > 0) {
			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			LocalDateTime dateTime;
			try {
				 dateTime = LocalDateTime.parse(PVP_RANKING_RESET_START_TIME, formatter);
			} catch (DateTimeParseException e) {
				log.error("RankingPlugin parse PVP_RANKING_RESET_START_TIME exception " + e);
				dateTime = LocalDateTime.parse("2026-01-01 00:00:00", formatter);
			}
			long timestamp = dateTime
					.atZone(ZoneId.systemDefault())
					.toInstant()
					.toEpochMilli();
			long now = System.currentTimeMillis();
			long interval = PVP_RANKING_RESET_INTERVAL * 3_600_000L;
			long steps = Math.max(0, (now - timestamp + interval - 1) / interval);
			long next = timestamp + steps * interval;
			long nextRun = next - now;
			ResetPvpRanking rpr = new ResetPvpRanking();
			if (Log.loggingDebug)
				log.debug("RankingPlugin nextRun=" + nextRun + " PVP_RANKING_RESET_INTERVAL=" + PVP_RANKING_RESET_INTERVAL);
			taskReset = Engine.getExecutor().scheduleAtFixedRate(rpr, nextRun, PVP_RANKING_RESET_INTERVAL * 3_600_000L, TimeUnit.MILLISECONDS);

		}


		Log.debug("RankingPlugin ReloadTemplates End");
	}


	// how to process incoming messages
	protected void registerHooks() {
		getHookManager().addHook(RankingClient.MSG_TYPE_GET_RANKING, new GetRankingHook());
		getHookManager().addHook(RankingClient.MSG_TYPE_GET_RANKING_LIST, new GetRankingListHook());
		getHookManager().addHook(RankingClient.MSG_TYPE_RESET_PVP_RANKING, new ResetPvpRankingHook());

	}

	 class ResetPvpRankingHook implements Hook {
		public boolean processMessage(Message msg, int flags) {
			ExtensionMessage message = (ExtensionMessage) msg;
			OID senderOid = message.getSubject();

				Serializable adminLevel = null;
				try {
					adminLevel = EnginePlugin.getObjectProperty(senderOid, WorldManagerClient.NAMESPACE, "adminLevel");
				} catch (Exception e) {
					log.debug("Cant get property adminLevel for "+senderOid);
				}
				if(adminLevel!=null) {
					int lev = (int)adminLevel;
					if (lev < 5) {
						ExtendedCombatMessages.sendErrorMessage(senderOid, "You dont have permission to reset PVP Ranking.");
						return true;
					}
				}else {
					ExtendedCombatMessages.sendErrorMessage(senderOid, "You dont have permission to reset PVP Ranking.");
					return true;
				}

			Log.debug("ResetPvpRanking running");
			ArrayList<Integer> currencyList = new ArrayList<Integer>();
			for (AchievementSetting as : settings) {
				log.debug("ResetPvpRanking " + as);
				if(as.getType() == (int)AchievementsClient.PVP_KILL){
					aDB.deleteCollectionData(as.getId());
					aDB.deleteRanking(as.getId());
				}
				if(as.getType() == (int)AchievementsClient.CURRENCY){
					AtomicBoolean cur = new AtomicBoolean(false);
					CombatPlugin.PVP_RANKS.forEach((k,v)->{
						if(Objects.equals(v.getCurrency(), as.getSubType()) && !cur.get()) {
							cur.set(true);
							AgisInventoryClient.setCurrencyAllPlayers(v.getCurrency(), 0);
							if(!currencyList.contains(v.getCurrency())){
								currencyList.add(v.getCurrency());
							}
						}
					});
					aDB.deleteRanking(as.getId());
				}
			}
			for (Integer c :currencyList) {
				Engine.getDatabase().alterCurrencyForAllPlayers(c, 0);
			}
			Log.debug("ResetPvpRanking end ");

			return true;
		}
	}


	class GetRankingListHook implements Hook {
		public boolean processMessage(Message msg, int flags) {
			ExtensionMessage message = (ExtensionMessage) msg;
			OID playerOid = message.getSubject();
			// int id = (int) message.getProperty("id");
			log.debug("GetRankingListHook playerOid=" + playerOid);
			TargetedExtensionMessage sMsg = new TargetedExtensionMessage(playerOid);
			sMsg.setExtensionType(RankingClient.EXTMSG_RANKING_LIST);
			int i = 0;
			for (AchievementSetting as : settings) {
				sMsg.setProperty("name" + i, as.getName());
				sMsg.setProperty("desc" + i, as.getDescription());
				sMsg.setProperty("id" + i, as.getId());
				i++;
			}
			sMsg.setProperty("num", i);
			Engine.getAgent().sendBroadcast(sMsg);

			log.debug("GetRankingListHook End");
			return true;
		}
	}


	class GetRankingHook implements Hook {
		public boolean processMessage(Message msg, int flags) {
			ExtensionMessage message = (ExtensionMessage) msg;
			OID playerOid = message.getSubject();
			int id = (int) message.getProperty("id");
			log.debug("GetRankingHook playerOid=" + playerOid + " id=" + id);
			TargetedExtensionMessage sMsg = new TargetedExtensionMessage(playerOid);
			sMsg.setExtensionType(RankingClient.EXTMSG_RANKING_UPDATE);
			AchievementSetting setting = null;
			for (AchievementSetting as : settings) {
				if(as.getId() == id){
					setting = as;
					break;
				}
			}
			int i = 0;
			ArrayList<Ranking> rankings = aDB.getRanking(id);
			for (Ranking r : rankings) {
				sMsg.setProperty("name" + i, aDB.getCharacterNameByOid(r.getSubjectOid()));
				sMsg.setProperty("value" + i, r.getValue());
				sMsg.setProperty("pos" + i, r.getPosition());
				sMsg.setProperty("color" + i, (setting != null ? setting.getDistinction(i+1) : ""));
				i++;
			}
			sMsg.setProperty("id", id);
			sMsg.setProperty("num", i);
			Engine.getAgent().sendBroadcast(sMsg);

			log.debug("GetRankingHook End");
			return true;
		}
	}

	public class RankingCalculating implements Runnable {

		public RankingCalculating() {

		}

		@Override
		public void run() {
			// Check user still has items
			Log.debug("RankingCalculating running");
			aDB.saveLastRankingRun();
			ArrayList<Ranking> rankings = new ArrayList<Ranking>();
			for (AchievementSetting as : settings) {
				if(as.getType() == (int)AchievementsClient.CURRENCY){
					Database db = Engine.getDatabase();
					if(as.getSubType()==0) {
						LinkedHashMap<Long, Long> lhm = db.getCurrenciesForPlayers(as.getParam1(), as.getValue());
						AtomicInteger i = new AtomicInteger();
						lhm.forEach((k, v) -> {
							if (v.intValue() > 0) {
								Ranking r = new Ranking(OID.fromLong(k), (int) as.getId(), i.incrementAndGet(), v.intValue());
								rankings.add(r);
							}
						});
					}else if(as.getSubType()==1){
						LinkedHashMap<Long, Long> lhm = db.getCurrenciesForPlayersPerFaction(as.getParam1(),as.getParam2(), as.getValue());
						AtomicInteger i = new AtomicInteger();
						lhm.forEach((k, v) -> {
							if (v.intValue() > 0) {
								Ranking r = new Ranking(OID.fromLong(k), (int) as.getId(), i.incrementAndGet(), v.intValue());
								rankings.add(r);
							}
						});
					}
				} else {
					log.debug("RankingCalculating " + as);
					ArrayList<CollectionData> arr = aDB.getCollectionData(as.getId(), -1, as.getValue());
					log.debug("RankingCalculating " + arr);
					int i = 0;
					for (CollectionData cd : arr) {
						log.debug("RankingCalculating " + cd);
						i++;
						Ranking r = new Ranking(cd.getSubjectOid(), (int) as.getId(), i, cd.getValue());
						rankings.add(r);
					/*if (as.getValue() <= i) {
						break;
					}*/
					}
				}
			}

			aDB.saveRanking(rankings);
			Log.debug("RankingCalculating end ");
		}
	}

	public class ResetPvpRanking implements Runnable {

		public ResetPvpRanking() {
			Log.debug("ResetPvpRanking setup");
		}

		@Override
		public void run() {
			// Check user still has items
			Log.debug("ResetPvpRanking running");
			ArrayList<Integer> currencyList = new ArrayList<Integer>();
			for (AchievementSetting as : settings) {
				log.debug("ResetPvpRanking " + as);
				if(as.getType() == (int)AchievementsClient.PVP_KILL){
					aDB.deleteCollectionData(as.getId());
					aDB.deleteRanking(as.getId());
				}
				if(as.getType() == (int)AchievementsClient.CURRENCY){
					AtomicBoolean cur = new AtomicBoolean(false);
					CombatPlugin.PVP_RANKS.forEach((k,v)->{
						if(Objects.equals(v.getCurrency(), as.getSubType()) && !cur.get()) {
							cur.set(true);
							AgisInventoryClient.setCurrencyAllPlayers(v.getCurrency(), 0);
							if(!currencyList.contains(v.getCurrency())){
								currencyList.add(v.getCurrency());
							}

						}
					});
					aDB.deleteRanking(as.getId());
				}
			}
			for (Integer c :currencyList) {
				Engine.getDatabase().alterCurrencyForAllPlayers(c, 0);
			}
			Log.debug("ResetPvpRanking end ");
		}
	}


	ScheduledFuture task = null;
	ScheduledFuture taskReset = null;
	ArrayList<AchievementSetting> settings = new ArrayList<AchievementSetting>();
	private AccountDatabase aDB;
	protected AuthDatabase authDB;

	private int RANKING_CALCULATION_INTERVAL = 1440;// in minutes
	private long PVP_RANKING_RESET_INTERVAL = 1;// in hours
	private String PVP_RANKING_RESET_START_TIME = "2026-01-01 00:00:00";// timestamp
	private static final Logger log = new Logger("Ranking");


}
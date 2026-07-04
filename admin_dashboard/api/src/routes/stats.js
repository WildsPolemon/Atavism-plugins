import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

async function safeQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return null;
    throw err;
  }
}

router.get('/overview', async (_req, res, next) => {
  try {
    const [accounts] = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(created) = CURDATE() THEN 1 ELSE 0 END) AS registered_today,
        SUM(CASE WHEN DATE(created) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS registered_yesterday,
        SUM(CASE WHEN last_login IS NOT NULL AND DATE(last_login) = CURDATE() THEN 1 ELSE 0 END) AS logins_today,
        SUM(CASE WHEN last_login IS NOT NULL AND DATE(last_login) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS active_7d
      FROM account
    `);

    const serverStats = await safeQuery(
      'SELECT players_online, logins_since_restart, last_update FROM server_stats LIMIT 1'
    );
    const serverStatus = await safeQuery(
      'SELECT status, last_update FROM server_status LIMIT 1'
    );

    const onlineNow = serverStats?.[0]?.players_online ?? 0;
    const loginsSinceRestart = serverStats?.[0]?.logins_since_restart ?? 0;

    let loginsTodayFromLogs = null;
    const loginLog = await safeQuery(`
      SELECT COUNT(*) AS cnt FROM data_logs
      WHERE event_type = 'PLAYER_LOGGED_IN_EVENT'
        AND DATE(event_time) = CURDATE()
    `);
    if (loginLog) loginsTodayFromLogs = loginLog[0]?.cnt ?? 0;

    res.json({
      onlineNow,
      totalAccounts: accounts.total ?? 0,
      registeredToday: accounts.registered_today ?? 0,
      registeredYesterday: accounts.registered_yesterday ?? 0,
      loginsToday: loginsTodayFromLogs ?? accounts.logins_today ?? 0,
      activeLast7Days: accounts.active_7d ?? 0,
      loginsSinceRestart,
      serverOnline: serverStatus?.[0]?.status === 1,
      serverLastUpdate: serverStatus?.[0]?.last_update ?? serverStats?.[0]?.last_update ?? null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/registrations', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365);
    const rows = await query(
      `
      SELECT DATE(created) AS date, COUNT(*) AS count
      FROM account
      WHERE created >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created)
      ORDER BY date ASC
    `,
      [days]
    );
    res.json({ days, series: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/logins', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365);

    const fromLogs = await safeQuery(
      `
      SELECT DATE(event_time) AS date, COUNT(*) AS count
      FROM data_logs
      WHERE event_type = 'PLAYER_LOGGED_IN_EVENT'
        AND event_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(event_time)
      ORDER BY date ASC
    `,
      [days]
    );

    if (fromLogs && fromLogs.length > 0) {
      return res.json({ days, source: 'data_logs', series: fromLogs });
    }

    const fromAccounts = await query(
      `
      SELECT DATE(last_login) AS date, COUNT(*) AS count
      FROM account
      WHERE last_login IS NOT NULL
        AND last_login >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(last_login)
      ORDER BY date ASC
    `,
      [days]
    );
    res.json({ days, source: 'account.last_login', series: fromAccounts });
  } catch (err) {
    next(err);
  }
});

router.get('/online-history', async (req, res, next) => {
  try {
    const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 168);
    const rows = await safeQuery(
      `
      SELECT recorded_at, players_online
      FROM online_snapshots
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY recorded_at ASC
    `,
      [hours]
    );

    if (!rows || rows.length === 0) {
      const current = await safeQuery(
        'SELECT players_online, last_update FROM server_stats LIMIT 1'
      );
      return res.json({
        hours,
        source: 'server_stats',
        series: current?.[0]
          ? [{ recorded_at: current[0].last_update, players_online: current[0].players_online }]
          : [],
      });
    }

    res.json({ hours, source: 'online_snapshots', series: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/events', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 10), 200);
    const rows = await safeQuery(
      `
      SELECT id, event_type, event_time, data
      FROM data_logs
      ORDER BY event_time DESC
      LIMIT ?
    `,
      [limit]
    );
    res.json({ events: rows ?? [] });
  } catch (err) {
    next(err);
  }
});

router.get('/event-breakdown', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
    const rows = await safeQuery(
      `
      SELECT event_type, COUNT(*) AS count
      FROM data_logs
      WHERE event_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY event_type
      ORDER BY count DESC
    `,
      [days]
    );
    res.json({ days, breakdown: rows ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;

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

router.get('/status', async (_req, res, next) => {
  try {
    const status = await safeQuery(
      'SELECT status, last_update FROM server_status LIMIT 1'
    );
    const stats = await safeQuery(
      'SELECT players_online, logins_since_restart, last_update FROM server_stats LIMIT 1'
    );

    res.json({
      online: status?.[0]?.status === 1,
      statusLastUpdate: status?.[0]?.last_update ?? null,
      playersOnline: stats?.[0]?.players_online ?? 0,
      loginsSinceRestart: stats?.[0]?.logins_since_restart ?? 0,
      statsLastUpdate: stats?.[0]?.last_update ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ db: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ db: 'error', timestamp: new Date().toISOString() });
  }
});

export default router;

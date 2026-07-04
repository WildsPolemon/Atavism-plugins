import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 10), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE username LIKE ? OR email LIKE ?';
      const like = `%${search}%`;
      params.push(like, like);
    }

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM account ${where}`,
      params
    );

    const rows = await query(
      `
      SELECT id, username, email, status_id, created, last_login
      FROM account
      ${where}
      ORDER BY created DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, offset]
    );

    res.json({
      page,
      limit,
      total: countRow.total,
      accounts: rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

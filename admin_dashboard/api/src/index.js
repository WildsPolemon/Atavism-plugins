import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRouter from './routes/stats.js';
import accountsRouter from './routes/accounts.js';
import serverRouter from './routes/server.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api', (_req, res) => {
  res.json({ name: 'Atavism Admin API', version: '1.0.0' });
});

app.use('/api/stats', statsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/server', serverRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: err.code,
  });
});

app.listen(PORT, () => {
  console.log(`Atavism Admin API listening on http://localhost:${PORT}`);
});

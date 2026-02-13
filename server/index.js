import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import mangaRoutes from './routes/mangaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => console.log(`Server running on ${port}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

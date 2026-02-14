import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import mangaRoutes from './routes/mangaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/creator', creatorRoutes);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => console.log(`Server running on ${port}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

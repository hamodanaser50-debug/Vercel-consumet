import express from 'express';
import cors from 'cors';
import { MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

const flixhq = new MOVIES.FlixHQ();

// 1. إضافة الـ Route الرئيسي لمعالجة طلبات الصفحة الأولى /
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Consumet API is running successfully on Vercel!'
  });
});

// 2. الـ Endpoint الخاص بجلب الـ Stream للمشغل
app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId } = req.query;
    if (!episodeId || !mediaId) {
      return res.status(400).json({ error: 'episodeId and mediaId are required' });
    }

    const response = await flixhq.fetchEpisodeSources(episodeId, mediaId);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default app;

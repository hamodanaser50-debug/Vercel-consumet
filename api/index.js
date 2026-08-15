import express from 'express';
import cors from 'cors';
import { MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

const flixhq = new MOVIES.FlixHQ();

// Endpoint للتحقق من عمل الباكأند
app.get('/', (req, res) => {
  res.send('Vercel Serverless Express Backend is Running!');
});

// Endpoint لجلب رابط Stream
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

// تصدير تطبيق Express كـ Handler لـ Vercel
export default app;
import express from 'express';
import cors from 'cors';
import { MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

// تغيير المصدر لـ MovieHDWatch أو FlixHQ مع التعامل مع الأخطاء
const provider = new MOVIES.MovieHDWatch();

app.get('/', (req, res) => {
  res.status(200).json({ status: 'online', message: 'Consumet API is working' });
});

// Endpoint البحث
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter required' });

    const results = await provider.search(query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint جلب المعلومات
app.get('/api/info', async (req, res) => {
  try {
    const { mediaId } = req.query;
    if (!mediaId) return res.status(400).json({ error: 'mediaId parameter required' });

    const info = await provider.fetchMediaInfo(mediaId);
    return res.json(info);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint جلب الـ Stream
app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId } = req.query;
    if (!episodeId || !mediaId) {
      return res.status(400).json({ error: 'episodeId and mediaId parameters required' });
    }

    const sources = await provider.fetchEpisodeSources(episodeId, mediaId);
    return res.json(sources);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default app;

import express from 'express';
import cors from 'cors';
import { MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

// استخدام FlixHQ (موجود ومضمون فـ MOVIES)
const flixhq = new MOVIES.FlixHQ();

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Consumet Express API is running on Vercel!'
  });
});

// Endpoint البحث
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    const results = await flixhq.search(query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching media' });
  }
});

// Endpoint المعطيات التفصيلية والحلقات
app.get('/api/info', async (req, res) => {
  try {
    const { mediaId } = req.query;
    if (!mediaId) return res.status(400).json({ error: 'mediaId parameter is required' });

    const info = await flixhq.fetchMediaInfo(mediaId);
    return res.json(info);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching info' });
  }
});

// Endpoint جلب رابط الـ Stream (m3u8)
app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId } = req.query;
    if (!episodeId || !mediaId) {
      return res.status(400).json({ error: 'episodeId and mediaId parameters are required' });
    }

    const sources = await flixhq.fetchEpisodeSources(episodeId, mediaId);
    return res.json(sources);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching sources' });
  }
});

export default app;

import express from 'express';
import cors from 'cors';
import { MOVIES, ANIME } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

// تهيئة المصادر
const providers = {
  gogoanime: new ANIME.Gogoanime(),
  zoro: new ANIME.Zoro(),
  kdrama: new MOVIES.MovieKdramacool(),
  flixhq: new MOVIES.FlixHQ()
};

// 1. الصفحة الرئيسية لتفقد السيرفر وقائمة المصادر
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    availableProviders: Object.keys(providers),
    defaultProvider: 'gogoanime'
  });
});

// 2. Endpoint البحث (يدعم تكييف المصدر)
app.get('/api/search', async (req, res) => {
  try {
    const { query, provider = 'gogoanime' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required (e.g. ?query=avatar)' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ 
        error: `Invalid provider. Choose from: ${Object.keys(providers).join(', ')}` 
      });
    }

    const results = await selectedProvider.search(query);
    return res.json({ provider, ...results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching media' });
  }
});

// 3. Endpoint جلب التفاصيل والحلقات
app.get('/api/info', async (req, res) => {
  try {
    const { mediaId, provider = 'gogoanime' } = req.query;

    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId parameter required' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // دعم الاختلاف بين طريقة fetchAnimeInfo و fetchMediaInfo
    const info = selectedProvider.fetchAnimeInfo 
      ? await selectedProvider.fetchAnimeInfo(mediaId)
      : await selectedProvider.fetchMediaInfo(mediaId);

    return res.json({ provider, ...info });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching info' });
  }
});

// 4. Endpoint جلب رابط الـ Stream (m3u8)
app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId, provider = 'gogoanime' } = req.query;

    if (!episodeId) {
      return res.status(400).json({ error: 'episodeId parameter required' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const sources = await selectedProvider.fetchEpisodeSources(episodeId, mediaId);
    return res.json({ provider, ...sources });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching stream sources' });
  }
});

export default app;

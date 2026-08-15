import express from 'express';
import cors from 'cors';
import { ANIME, MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

// 1. تهيئة المصادر المستقرة داخل Try/Catch لمنع طيحان السيرفر
let providers = {};

try {
  providers = {
    gogoanime: new ANIME.Gogoanime(),
    flixhq: new MOVIES.FlixHQ()
  };
} catch (err) {
  console.error("Error initializing providers:", err);
}

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Consumet Multi-Provider API is running!',
    availableProviders: Object.keys(providers)
  });
});

// Endpoint البحث
app.get('/api/search', async (req, res) => {
  try {
    const { query, provider = 'gogoanime' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ 
        error: `Invalid provider. Available providers: ${Object.keys(providers).join(', ')}` 
      });
    }

    const results = await selectedProvider.search(query);
    return res.json({ provider, ...results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching media' });
  }
});

// Endpoint التفاصيل والحلقات
app.get('/api/info', async (req, res) => {
  try {
    const { mediaId, provider = 'gogoanime' } = req.query;

    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId parameter is required' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const info = selectedProvider.fetchAnimeInfo 
      ? await selectedProvider.fetchAnimeInfo(mediaId)
      : await selectedProvider.fetchMediaInfo(mediaId);

    return res.json({ provider, ...info });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching info' });
  }
});

// Endpoint جلب رابط الـ Stream
app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId, provider = 'gogoanime' } = req.query;

    if (!episodeId) {
      return res.status(400).json({ error: 'episodeId parameter is required' });
    }

    const selectedProvider = providers[provider.toLowerCase()];
    if (!selectedProvider) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const sources = await selectedProvider.fetchEpisodeSources(episodeId, mediaId);
    return res.json({ provider, ...sources });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching stream' });
  }
});

export default app;

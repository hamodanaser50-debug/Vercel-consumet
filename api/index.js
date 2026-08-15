import express from 'express';
import cors from 'cors';
import { ANIME, MOVIES } from '@consumet/extensions';

const app = express();

app.use(cors());
app.use(express.json());

function getProvider(name) {
  const providerName = (name || 'gogoanime').toLowerCase();
  
  switch (providerName) {
    case 'gogoanime':
      return { instance: new ANIME.Gogoanime(), type: 'anime' };
    case 'movies':
    case 'flixhq':
      // استعمال MovieKdramacool كبديل قوي للأفلام والمسلسلات بدون Block
      return { instance: new MOVIES.MovieKdramacool(), type: 'movie' };
    default:
      return null;
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    availableProviders: ['gogoanime', 'movies']
  });
});

app.get('/api/search', async (req, res) => {
  try {
    const { query, provider = 'movies' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const selected = getProvider(provider);
    if (!selected) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const results = await selected.instance.search(query);
    return res.json({ provider, ...results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching media' });
  }
});

app.get('/api/info', async (req, res) => {
  try {
    const { mediaId, provider = 'movies' } = req.query;

    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId parameter is required' });
    }

    const selected = getProvider(provider);
    if (!selected) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const info = selected.type === 'anime'
      ? await selected.instance.fetchAnimeInfo(mediaId)
      : await selected.instance.fetchMediaInfo(mediaId);

    return res.json({ provider, ...info });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching info' });
  }
});

app.get('/api/watch', async (req, res) => {
  try {
    const { episodeId, mediaId, provider = 'movies' } = req.query;

    if (!episodeId) {
      return res.status(400).json({ error: 'episodeId parameter is required' });
    }

    const selected = getProvider(provider);
    if (!selected) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const sources = await selected.instance.fetchEpisodeSources(episodeId, mediaId);
    return res.json({ provider, ...sources });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching stream' });
  }
});

export default app;

import express from 'express';
import cors from 'cors';
import { ANIME, MOVIES } from '@consumet/extensions';
import { HttpsProxyAgent } from 'https-proxy-agent';

const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// بيانات البروكسي الخاصة بك من Webshare
// ----------------------------------------------------
const PROXY_USER = 'ftovvzbd';
const PROXY_PASS = 'flugw5rta0mn';
const PROXY_HOST = '31.59.20.176';
const PROXY_PORT = '6754';

const proxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`;
const agent = new HttpsProxyAgent(proxyUrl);

function getProvider(name) {
  const providerName = (name || 'gogoanime').toLowerCase();

  switch (providerName) {
    case 'gogoanime':
      return { instance: new ANIME.Gogoanime(), type: 'anime' };

    case 'flixhq':
    case 'movies': {
      const flix = new MOVIES.FlixHQ();
      
      // ربط الـ Proxy بـ Axios لتجاوز حظر Vercel (522)
      if (flix.client && flix.client.defaults) {
        flix.client.defaults.httpsAgent = agent;
        flix.client.defaults.httpAgent = agent;
      }
      return { instance: flix, type: 'movie' };
    }

    default:
      return null;
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Consumet API with Proxy',
    availableProviders: ['gogoanime', 'flixhq']
  });
});

app.get('/api/search', async (req, res) => {
  try {
    const { query, provider = 'flixhq' } = req.query;

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
    const { mediaId, provider = 'flixhq' } = req.query;

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
    const { episodeId, mediaId, provider = 'flixhq' } = req.query;

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

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// مفتاح TMDB مجاني وسريع للبحث والجلب
const TMDB_API_KEY = '15d21e5f888d17262f23f82168346279';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 1. Endpoint البحث عن الأفلام والمسلسلات
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    const results = (data.results || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        id: item.id,
        title: item.title || item.name,
        type: item.media_type,
        releaseDate: item.release_date || item.first_air_date,
        poster: item.poster_path ? `https://image.tmdb.org/tpx/t/p/w500${item.poster_path}` : null,
        overview: item.overview,
        rating: item.vote_average,
      }));

    return res.json({ provider: 'tmdb', results });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching media' });
  }
});

// 2. Endpoint التفاصيل
app.get('/api/info', async (req, res) => {
  try {
    const { mediaId, type = 'movie' } = req.query;
    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId is required' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/${type}/${mediaId}?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();

    return res.json({
      id: data.id,
      title: data.title || data.name,
      type,
      overview: data.overview,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      genres: data.genres,
      seasons: data.seasons || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching info' });
  }
});

// 3. Endpoint جلب رابط المشاهدة المباشر (VidSrc API)
app.get('/api/watch', async (req, res) => {
  try {
    const { mediaId, type = 'movie', season = 1, episode = 1 } = req.query;
    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId is required' });
    }

    // روابط السيرفرات المباشرة للمشاهدة
    const streamUrl =
      type === 'movie'
        ? `https://vidsrc.to/embed/movie/${mediaId}`
        : `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`;

    return res.json({
      provider: 'vidsrc',
      mediaId,
      streamUrl,
      embedUrl: streamUrl,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error fetching watch links' });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'online', message: 'Fast Movies API running smoothly' });
});

export default app;

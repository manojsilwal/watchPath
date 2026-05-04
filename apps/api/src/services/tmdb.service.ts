import fetch from 'node-fetch';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbService = {
  async search(query: string) {
    if (TMDB_API_KEY === 'replace_me' || !TMDB_API_KEY) {
      const q = query.toLowerCase();
      if (q.includes('f1')) {
        return [{
          titleId: 'tmdb_movie_123456',
          title: 'F1',
          year: 2025,
          type: 'movie',
          posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg', // Placeholder
          matchConfidence: 0.98
        }];
      } else if (q.includes('dune')) {
        return [{
          titleId: 'tmdb_movie_693134',
          title: 'Dune: Part Two',
          year: 2024,
          type: 'movie',
          posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg',
          matchConfidence: 0.98
        }];
      } else {
        return [];
      }
    }
    const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      titleId: `tmdb_${r.media_type}_${r.id}`,
      title: r.title || r.name,
      year: r.release_date ? parseInt(r.release_date.split('-')[0]) : r.first_air_date ? parseInt(r.first_air_date.split('-')[0]) : null,
      type: r.media_type,
      posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      matchConfidence: 0.9
    }));
  },

  async getTitle(id: string) {
    if (TMDB_API_KEY === 'replace_me' || !TMDB_API_KEY) {
      if (id === 'tmdb_movie_693134') {
        return {
          titleId: 'tmdb_movie_693134',
          title: 'Dune: Part Two',
          year: 2024,
          runtimeMinutes: 166,
          posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg'
        };
      } else if (id === 'tmdb_movie_123456') {
        return {
          titleId: 'tmdb_movie_123456',
          title: 'F1',
          year: 2025,
          runtimeMinutes: 120,
          posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9CW.jpg'
        };
      }
      return null;
    }
    const parts = id.split('_');
    if (parts.length !== 3 || parts[0] !== 'tmdb') return null;
    const type = parts[1];
    const tmdbId = parts[2];

    const response = await fetch(`${BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      titleId: id,
      title: data.title || data.name,
      year: data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : null,
      runtimeMinutes: data.runtime || data.episode_run_time?.[0] || 0,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
    };
  }
};

import fetch from 'node-fetch';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

export const tmdbService = {
  async search(query: string) {
    if (TMDB_API_KEY === 'replace_me' || !TMDB_API_KEY) {
      // Use free TVMaze API instead of mock
      const response = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return (data || []).slice(0, 10).map((r: any) => {
        const show = r.show;
        return {
          titleId: `tvmaze_show_${show.id}`,
          title: show.name,
          year: show.premiered ? parseInt(show.premiered.split('-')[0]) : null,
          type: 'show',
          posterUrl: show.image?.medium || null,
          matchConfidence: r.score
        };
      });
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
      const parts = id.split('_');
      if (parts.length !== 3 || parts[0] !== 'tvmaze') return null;
      const tvmazeId = parts[2];
      const response = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}`);
      if (!response.ok) return null;
      const show = await response.json();

      return {
        titleId: id,
        title: show.name,
        year: show.premiered ? parseInt(show.premiered.split('-')[0]) : null,
        runtimeMinutes: show.averageRuntime || show.runtime || 0,
        posterUrl: show.image?.original || show.image?.medium || null,
        _tvmazeData: show // store raw data to extract network/webChannel later
      };
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

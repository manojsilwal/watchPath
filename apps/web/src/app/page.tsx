'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('US');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}&country=${country}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-center flex-col flex">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold tracking-wide">
            Now in Beta
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            WatchPath AI
          </h1>
          <p className="text-lg sm:text-2xl text-gray-600 max-w-2xl mx-auto font-medium">
            Find the real movie, the right platform, and the cheapest legal way to watch.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4 w-full max-w-3xl flex-col sm:flex-row p-4 sm:p-2 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a movie or show..."
              className="w-full p-4 sm:p-5 rounded-xl bg-white/80 border-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full sm:w-auto p-4 sm:p-5 rounded-xl bg-white/80 border-transparent text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner font-medium appearance-none pr-10"
            >
              <option value="US">🇺🇸 US</option>
              <option value="GB">🇬🇧 UK</option>
              <option value="CA">🇨🇦 CA</option>
              <option value="AU">🇦🇺 AU</option>
              <option value="IN">🇮🇳 IN</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <button
            type="submit"
            className="px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
          >
            Search
          </button>
        </form>
      </div>
    </main>
  );
}

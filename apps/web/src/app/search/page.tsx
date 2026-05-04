'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Suspense } from 'react';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const country = searchParams.get('country') || 'US';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000'}/api/search?query=${encodeURIComponent(query)}&country=${country}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [query, country]);

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline mb-8 inline-block transition-colors">&larr; Back to search</Link>
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Search Results for "{query}"</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-xl text-gray-500 font-medium animate-pulse">Loading...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <p className="text-xl text-gray-500">No results found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, idx) => (
              <Link href={`/title/${result.titleId}?country=${country}`} key={idx}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex h-full">
                  {result.posterUrl ? (
                    <img src={result.posterUrl} alt={result.title} className="w-28 object-cover border-r border-gray-100" />
                  ) : (
                    <div className="w-28 bg-gray-100 flex items-center justify-center text-gray-400 border-r border-gray-100 text-sm font-medium">No Image</div>
                  )}
                  <div className="p-5 flex flex-col justify-center flex-1">
                    <h2 className="font-bold text-xl leading-tight mb-2 text-gray-900">{result.title}</h2>
                    <p className="text-indigo-600 font-medium text-sm">
                      {result.year} &bull; {result.type === 'movie' ? 'Movie' : 'TV Show'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SearchResultsContent />
    </Suspense>
  );
}

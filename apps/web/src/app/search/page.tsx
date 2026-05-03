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
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">&larr; Back to search</Link>
        <h1 className="text-3xl font-bold mb-8">Search Results for "{query}"</h1>

        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, idx) => (
              <Link href={`/title/${result.titleId}?country=${country}`} key={idx}>
                <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow flex h-full">
                  {result.posterUrl ? (
                    <img src={result.posterUrl} alt={result.title} className="w-24 object-cover" />
                  ) : (
                    <div className="w-24 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="p-4 flex flex-col justify-center">
                    <h2 className="font-bold text-lg leading-tight mb-1">{result.title}</h2>
                    <p className="text-gray-500 text-sm">
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

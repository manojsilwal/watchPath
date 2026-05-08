'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Film } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getApiBaseUrl } from '@/lib/api-base';

type Result = {
  titleId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  type: string;
  overview?: string;
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const country = searchParams.get('country') || 'US';
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `${getApiBaseUrl()}/api/search?query=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, country]);

  return (
    <main className="flex-1 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Search Results</h1>
          </div>
          <p className="text-gray-600">
            {loading
              ? 'Searching…'
              : `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}" in ${country}`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading…</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((title) => (
              <Link key={title.titleId} href={`/title/${title.titleId}?country=${country}`}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-200 h-full">
                  <CardContent className="p-0">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg bg-gray-100">
                      {title.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={title.posterUrl}
                          alt={title.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/300x450/e2e8f0/64748b?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                      {title.year != null && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
                          {title.year}
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-semibold uppercase">
                        {title.type === 'movie' ? 'Movie' : title.type === 'tv' ? 'TV' : 'Show'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-2">{title.title}</h3>
                      {title.overview && (
                        <p className="text-xs text-gray-400 line-clamp-2">{title.overview}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No results found</h2>
            <p className="text-gray-500 mb-6">We couldn&apos;t find any movies or shows matching &quot;{query}&quot;</p>
            <Link href="/">
              <Button variant="default">Try Another Search</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchResults() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 py-8 px-4">
          <p className="text-center text-gray-500">Loading…</p>
        </main>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}

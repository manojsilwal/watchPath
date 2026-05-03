'use client';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TitleDetail({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const country = searchParams.get('country') || 'US';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unwrap params
  const { id } = React.use(params as any) as { id: string };

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/titles/${id}?country=${country}`)
      .then(res => {
        if (!res.ok) throw new Error('Title not found');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id, country]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline mb-8 inline-block">&larr; Back</button>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : data ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {data.title.posterUrl ? (
                <img src={data.title.posterUrl} alt={data.title.title} className="w-full md:w-64 object-cover" />
              ) : (
                <div className="w-full md:w-64 h-96 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
              )}

              <div className="p-8 flex-1">
                <h1 className="text-4xl font-bold mb-2">{data.title.title}</h1>
                <p className="text-gray-500 mb-6">
                  {data.title.year} &bull; {data.title.runtimeMinutes} min
                </p>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-900 mb-1">Cheapest Way to Watch ({country})</h3>
                  {data.bestOption ? (
                    <p className="text-blue-800">
                      Available on {data.bestOption.providerName} for {data.bestOption.incrementalCost === 0 ? 'Free' : `$${data.bestOption.incrementalCost}`}
                    </p>
                  ) : (
                    <p className="text-blue-800">No verified legal streaming option found in your country right now.</p>
                  )}
                </div>

                {data.verificationSummary?.suspiciousLinksFiltered > 0 && (
                  <p className="text-sm text-gray-500 mt-4 italic">
                    We found {data.verificationSummary.suspiciousLinksFiltered} free-looking link(s) online, but they appear to be trailers, recaps, or unofficial, so we did not show them.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, TrendingUp, Star, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { getApiBaseUrl } from '@/lib/api-base';

type SearchHit = {
  titleId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  type: string;
};

const FEATURED_QUERIES = ['Breaking Bad', 'Friends', 'The Office'];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('US');
  const [featured, setFeatured] = useState<SearchHit[]>([]);
  const router = useRouter();

  useEffect(() => {
    const base = getApiBaseUrl();
    let cancelled = false;
    (async () => {
      const hits: SearchHit[] = [];
      for (const q of FEATURED_QUERIES) {
        try {
          const res = await fetch(
            `${base}/api/search?query=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`,
          );
          const data = await res.json();
          const first = (data.results || [])[0] as SearchHit | undefined;
          if (first?.titleId) hits.push(first);
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setFeatured(hits);
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&country=${country}`);
    }
  };

  return (
    <main className="flex-1">
      <section className="py-16 px-4 sm:py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold tracking-wide">
              Now in Beta
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 text-foreground">
              Find the Real Movie
            </h1>
            <p className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Find the real movie, the right platform, and the cheapest legal way to watch.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex gap-4 w-full max-w-3xl mx-auto flex-col sm:flex-row p-4 sm:p-2 bg-transparent"
          >
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for a movie or show..."
                className="w-full pl-5 pr-12 p-5 rounded-xl bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-primary shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full sm:w-32 p-5 rounded-xl bg-zinc-900 border-zinc-800 text-white focus:ring-2 focus:ring-primary shadow-inner font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">🇺🇸 US</SelectItem>
                  <SelectItem value="GB">🇬🇧 UK</SelectItem>
                  <SelectItem value="CA">🇨🇦 CA</SelectItem>
                  <SelectItem value="AU">🇦🇺 AU</SelectItem>
                  <SelectItem value="IN">🇮🇳 IN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="px-8 py-5 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="py-12 px-4 bg-zinc-950/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
            How WatchPath AI Helps You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Legal Sources Only</h3>
                <p className="text-muted-foreground">
                  We filter out fake links, piracy sites, and misleading uploads. Only verified legal
                  streaming options.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cheapest Option</h3>
                <p className="text-muted-foreground">
                  We calculate the best value based on your existing subscriptions and find free legal
                  options.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Release Alerts</h3>
                <p className="text-muted-foreground">
                  Get notified when unavailable movies arrive on streaming, or when prices drop.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((movie) => (
                <Link key={movie.titleId} href={`/title/${movie.titleId}?country=${country}`}>
                  <Card className="group cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 h-full">
                    <CardContent className="p-0">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg bg-muted">
                        {movie.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No poster
                          </div>
                        )}
                        {movie.year != null && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
                            {movie.year}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{movie.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{movie.type}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Showing picks after search API responds…</p>
          )}
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border bg-zinc-950/50">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p className="text-sm">
            WatchPath AI helps you find legal streaming options. We never promote piracy or unauthorized
            content.
          </p>
          <p className="text-xs mt-2 text-muted-foreground">© 2026 WatchPath AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

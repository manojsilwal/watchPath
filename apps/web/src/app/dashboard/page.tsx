'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Trash2, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProviders, type Alert } from '@/lib/figma-mock';

export default function DashboardPage() {
  const [country, setCountry] = useState('US');
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCountry(localStorage.getItem('userCountry') || 'US');
    const subs = localStorage.getItem('userSubscriptions');
    setUserSubscriptions(subs ? (JSON.parse(subs) as string[]) : []);
    const rawAlerts = localStorage.getItem('userAlerts');
    setAlerts(
      rawAlerts
        ? (JSON.parse(rawAlerts) as Alert[])
        : [
            {
              id: 'alert_1',
              userId: 'user_1',
              titleId: 'tmdb_movie_693134',
              country: 'US',
              alertType: 'free_available',
              targetProvider: null,
              maxPrice: null,
              currency: 'USD',
              freeOnly: true,
              active: true,
              createdAt: new Date().toISOString(),
            },
          ],
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('userCountry', country);
  }, [country, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('userSubscriptions', JSON.stringify(userSubscriptions));
  }, [userSubscriptions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('userAlerts', JSON.stringify(alerts));
  }, [alerts, hydrated]);

  const toggleSubscription = (providerId: string) => {
    setUserSubscriptions((prev) => {
      if (prev.includes(providerId)) {
        toast.success('Subscription removed');
        return prev.filter((x) => x !== providerId);
      }
      toast.success('Subscription added');
      return [...prev, providerId];
    });
  };

  const toggleAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, active: !alert.active } : alert)),
    );
  };

  const deleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    toast.success('Alert deleted');
  };

  const subscriptionProviders = mockProviders.filter((p) => p.providerType === 'subscription');

  if (!hydrated) {
    return (
      <main className="flex-1 py-8 px-4">
        <p className="text-center text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and alerts to get personalized recommendations
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="country" className="mb-2 block">
                  Your Country
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country" className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                    <SelectItem value="IN">🇮🇳 India</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  This helps us show you relevant streaming availability in your region
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <CardTitle>Your Subscriptions</CardTitle>
            </div>
            <CardDescription>
              Select the streaming services you currently subscribe to. We factor this in on title pages
              when pricing options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionProviders.map((provider) => {
                const isSubscribed = userSubscriptions.includes(provider.id);
                return (
                  <button
                    type="button"
                    key={provider.id}
                    className={`
                      border-2 rounded-lg p-4 cursor-pointer transition-all text-left w-full
                      ${
                        isSubscribed
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-border/80 bg-zinc-900'
                      }
                    `}
                    onClick={() => toggleSubscription(provider.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 shadow-sm flex items-center justify-center flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={provider.logoUrl}
                          alt={provider.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{provider.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {isSubscribed ? (
                            <Badge className="bg-green-900/30 text-green-400 border-green-800 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {userSubscriptions.length > 0 && (
              <div className="mt-6 p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
                <p className="text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  You have {userSubscriptions.length} active subscription
                  {userSubscriptions.length !== 1 ? 's' : ''}. We use this on title detail pages.
                </p>
              </div>
            )}

            {userSubscriptions.length === 0 && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                <p className="text-sm text-blue-400">
                  Add your subscriptions to see $0 incremental pricing when a provider matches.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Your Alerts</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  Sample alerts stored locally — connect accounts later for real notifications.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-border bg-zinc-900/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={alert.active}
                              onCheckedChange={() => toggleAlert(alert.id)}
                            />
                            <Label className="text-sm font-medium cursor-pointer">
                              {alert.active ? 'Active' : 'Paused'}
                            </Label>
                          </div>
                          <Badge
                            variant="outline"
                            className={alert.alertType === 'free_available' ? 'bg-green-900/20' : ''}
                          >
                            {alert.alertType === 'free_available' && 'Free Available'}
                            {alert.alertType === 'price_drop' && 'Price Drop'}
                            {alert.alertType === 'available_on_provider' && 'Provider Available'}
                            {alert.alertType === 'available_under_price' && 'Under Price'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Title ID: {alert.titleId}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.freeOnly && 'Notify when available for free'}
                          {alert.maxPrice != null && `Notify when price drops below $${alert.maxPrice}`}
                          {alert.targetProvider && `Notify when available on ${alert.targetProvider}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">You don&apos;t have any alerts set up yet</p>
                <p className="text-sm text-muted-foreground">
                  Create alerts on movie detail pages to get notified when they become available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Home, LayoutDashboard, LogIn, LogOut, Shield } from 'lucide-react';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading, signOutUser } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Film className="w-8 h-8 text-primary group-hover:text-primary/80 transition-colors" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                WatchPath AI
              </p>
              <p className="text-xs text-muted-foreground">Legal streaming guide</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/">
              <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant={isActive('/admin') ? 'default' : 'ghost'} size="sm" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
            {!loading &&
              (user ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => signOutUser()}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[140px] truncate">{user.email}</span>
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Button>
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

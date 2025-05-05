'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LogoutButton } from '@/components/auth/logout-button';
import { Menu, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client'; 
import type { User } from '@supabase/supabase-js'; 

export default function NavBar() {
  const t = useTranslations('Navbar');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState('en');
  const [user, setUser] = useState<User | null>(null); // State for user session
  const supabase = createClient(); // Create Supabase client instance

  // Fetch user session and locale on mount, and listen for auth changes
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || 'en';
      return 'en';
    };
    setCurrentLocale(getCookie('NEXT_LOCALE'));

    // Fetch initial user state
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(data?.user ?? null);
      }
    };
    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]); 
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <nav className="px-2 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl bg-primary bg-clip-text text-transparent">
              Form<span className="text-gray-500 dark:text-gray-300">Craft</span>
            </span>
          </Link>
        </div>

        {/* Search Box - Centered */}
        <div className="hidden md:flex flex-1 justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-4 flex-shrink-0">
          <ThemeToggle />
          <select
            className="bg-background border rounded-md px-2 py-1"
            value={currentLocale}
            onChange={(e) => {
              const locale = e.target.value;
              document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
              window.location.reload();
            }}
          >
            <option value="en">{t('langEnglish')}</option>
            <option value="bn">{t('langBengali')}</option>
          </select>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={user.email || '@user'} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className='flex flex-col gap-1 items-center justify-center'>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  {t('dashboardLink')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/auth/login')}>{t('loginButton')}</Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden ml-auto"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b p-4 md:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <div className="flex flex-col space-y-4">
              <ThemeToggle />
              <select
                className="bg-background border rounded-md px-2 py-1"
                value={currentLocale}
                onChange={(e) => {
                  const locale = e.target.value;
                  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
                  window.location.reload();
                }}
              >
                <option value="en">{t('langEnglish')}</option>
                <option value="bn">{t('langBengali')}</option>
                {/* Add other languages as needed */}
              </select>
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start"
                    onClick={() => router.push('/dashboard')}
                  >
                    {t('dashboardLink')}
                  </Button>
                  <LogoutButton />
                </>
              ) : (
                <Button onClick={() => router.push('/auth/login')} className="w-full justify-center">
                  {t('loginButton')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
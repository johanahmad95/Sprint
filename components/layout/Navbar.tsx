'use client';

import { useState, useEffect } from 'react';
import { Home, LayoutGrid, Calendar } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { createClient } from '@/lib/supabase/client';

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Base navigation items (always visible)
  const baseNavItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Courts', url: '/venues', icon: LayoutGrid },
  ];

  // MyBooking item (only for logged-in users)
  const myBookingItem = { name: 'MyBooking', url: '/bookings', icon: Calendar };

  // Combine navigation items - include MyBooking only if user is logged in
  const navItems = [
    ...baseNavItems,
    ...(user ? [myBookingItem] : []),
  ];

  const logo = {
    text: 'Sprinto',
    url: '/',
    image: '/sprinto-logo.png?v=3',
  };

  const auth = {
    signIn: {
      text: 'Sign in',
      url: '/login',
    },
    signUp: {
      text: 'Sign up',
      url: '/signup',
    },
  };

  return <NavBar items={navItems} logo={logo} auth={auth} />;
};

export default Navbar;

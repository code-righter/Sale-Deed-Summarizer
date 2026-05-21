import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const DEMO_USER_KEY = 'legality_demo_user';

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isDemoMode: false,
  signOut: async () => {},
  demoLogin: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo mode first
    const demoUser = localStorage.getItem(DEMO_USER_KEY);
    if (demoUser) {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_USER_KEY);
      setIsDemoMode(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  const demoLogin = () => {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify({
      email: 'demo@legality.app',
      name: 'Demo User',
    }));
    setIsDemoMode(true);
  };

  // Create a mock user for demo mode
  const demoUser = isDemoMode ? {
    id: 'demo-user-id',
    email: 'demo@legality.app',
    user_metadata: { name: 'Demo User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as unknown as User : null;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: isDemoMode ? demoUser : session?.user ?? null, 
      loading, 
      isDemoMode,
      signOut,
      demoLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

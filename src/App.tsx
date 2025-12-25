import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AppShell, type View } from './layouts/AppShell';
import { TodoBoard } from './features/todo/TodoBoard';
import { NotesBoard } from './features/notes/NotesBoard';
import { Dashboard } from './features/dashboard/Dashboard';
import { SettingsBoard } from './features/settings/SettingsBoard';
import { PlannerBoard } from './features/planner/PlannerBoard';
import { LoginScreen } from './components/LoginScreen';
import type { Session } from '@supabase/supabase-js';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as View) || 'dashboard';
  });

  const { confirmNavigation } = useNavigation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (view: View) => {
    confirmNavigation(() => {
      setCurrentView(view);
      localStorage.setItem('currentView', view);
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'planner':
        return <PlannerBoard />;
      case 'tasks':
        return <TodoBoard />;
      case 'notes':
        return <NotesBoard />;
      case 'settings':
        return <SettingsBoard />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <AppShell currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
    </AppShell>
  );
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;

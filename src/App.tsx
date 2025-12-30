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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LearningWorkspace } from './features/learning/LearningWorkspace';
import { useWorkspace } from './contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { workspace } = useWorkspace();

  // We still use internal View state for the main dashboard to preserve existing logic
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem(`myadmin_view_${workspace}`);
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

  useEffect(() => {
    const saved = localStorage.getItem(`myadmin_view_${workspace}`);
    if (saved) {
      setCurrentView(saved as View);
    } else {
      setCurrentView('dashboard');
    }
  }, [workspace]);

  const handleNavigate = (view: View) => {
    confirmNavigation(() => {
      setCurrentView(view);
      localStorage.setItem(`myadmin_view_${workspace}`, view);
    });
  };

  const renderContent = () => {
    if (workspace === 'learning') {
      return <LearningWorkspace currentView={currentView} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'planner':
        return <PlannerBoard />;
      case 'tasks':
        return <TodoBoard />;
      case 'notes':
        return <NotesBoard />;
      case 'library':
      case 'roadmap':
        return <Dashboard />;
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
      <AnimatePresence mode="wait">
        <motion.div
          key={workspace + currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full overflow-hidden"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;

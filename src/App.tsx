import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AppShell } from './layouts/AppShell';
import { TodoBoard } from './features/todo/TodoBoard';
import { NotesBoard } from './features/notes/NotesBoard';
import { Dashboard } from './features/dashboard/Dashboard';
import { SettingsBoard } from './features/settings/SettingsBoard';
import { PlannerBoard } from './features/planner/PlannerBoard';
import { LoginScreen } from './components/LoginScreen';
import type { Session } from '@supabase/supabase-js';
import { NavigationProvider } from './contexts/NavigationContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LearningWorkspace } from './features/learning/LearningWorkspace';
import { useWorkspace } from './contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';
import HabitsPage from './features/habits/pages/HabitsPage';

import { Navigate, useLocation } from 'react-router-dom';

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { workspace } = useWorkspace();
  const location = useLocation();


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

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full overflow-hidden"
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planner" element={<PlannerBoard />} />
            <Route path="/tasks" element={<TodoBoard />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/notes" element={<NotesBoard />} />
            <Route path="/settings" element={<SettingsBoard />} />
            {workspace === 'learning' && (
              <>
                <Route path="/roadmap" element={<LearningWorkspace currentView="roadmap" />} />
                <Route path="/library" element={<LearningWorkspace currentView="library" />} />
              </>
            )}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <NavigationProvider>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;

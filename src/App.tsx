import { useState } from 'react';
import { AppShell } from './layouts/AppShell';
import { TodoBoard } from './features/todo/TodoBoard';
import { NotesBoard } from './features/notes/NotesBoard';
import { Dashboard } from './features/dashboard/Dashboard';
import { SettingsBoard } from './features/settings/SettingsBoard';

type View = 'tasks' | 'notes' | 'dashboard' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as View) || 'dashboard';
  });

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
  };

  return (
    <AppShell currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'tasks' && <TodoBoard />}
      {currentView === 'notes' && <NotesBoard />}
      {currentView === 'settings' && <SettingsBoard />}
    </AppShell>
  )
}

export default App

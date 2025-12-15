import { useState } from 'react';
import { AppShell, type View } from './layouts/AppShell';
import { TodoBoard } from './features/todo/TodoBoard';
import { NotesBoard } from './features/notes/NotesBoard';
import { Dashboard } from './features/dashboard/Dashboard';
import { SettingsBoard } from './features/settings/SettingsBoard';
import { PlannerBoard } from './features/planner/PlannerBoard';

function App() {
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as View) || 'dashboard';
  });

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
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

  return (
    <AppShell currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
    </AppShell>
  )
}

export default App

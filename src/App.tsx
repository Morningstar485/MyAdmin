import { useState } from 'react';
import { AppShell } from './layouts/AppShell';
import { TodoBoard } from './features/todo/TodoBoard';
import { NotesBoard } from './features/notes/NotesBoard';
import { Dashboard } from './features/dashboard/Dashboard';
import { SettingsBoard } from './features/settings/SettingsBoard';

type View = 'tasks' | 'notes' | 'dashboard' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <AppShell currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'tasks' && <TodoBoard />}
      {currentView === 'notes' && <NotesBoard />}
      {currentView === 'settings' && <SettingsBoard />}
    </AppShell>
  )
}

export default App

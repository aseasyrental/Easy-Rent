import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Shell from './components/Shell';
import Login from './pages/Login.jsx';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Login />;
  return <Shell />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

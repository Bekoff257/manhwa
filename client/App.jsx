import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import UploadPage from './pages/UploadPage';
import ReaderPage from './pages/ReaderPage';
import AdminPage from './pages/AdminPage';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/reader/:id" element={<ReaderPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;

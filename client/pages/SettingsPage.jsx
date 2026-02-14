import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SettingsPage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  const apply = async () => {
    const message = window.prompt('Why should you get the creator badge?') || '';
    try {
      await api.post('/creator/apply', { message });
      toast.success('Application submitted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply');
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-400">Creator badge status: {user.creatorBadge?.status || 'NONE'}</p>
      <button onClick={apply} className="rounded-lg bg-fuchsia-500/20 px-4 py-2 text-sm">Apply for Creator Badge</button>
    </div>
  );
};

export default SettingsPage;

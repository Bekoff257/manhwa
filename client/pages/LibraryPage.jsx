import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const tabs = ['PLANNED', 'READING', 'COMPLETED'];

const LibraryPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('PLANNED');
  const [q, setQ] = useState('');

  const load = async () => {
    const { data } = await api.get('/library');
    setItems(data.items || []);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.uid]);

  if (!user) return <Navigate to="/auth" replace />;

  const filtered = useMemo(
    () => items.filter((item) => item.status === tab && (item.manga?.title || '').toLowerCase().includes(q.toLowerCase())),
    [items, tab, q]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Library</h1>
      <div className="flex flex-wrap gap-2">{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === t ? 'bg-indigo-500' : 'bg-slate-800'}`}>{t}</button>)}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in this tab" className="w-full max-w-sm rounded-lg bg-slate-900 p-2" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Link key={`${item.mangaId}`} to={`/manga/${item.mangaId}`} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="font-medium">{item.manga?.title || 'Removed manga'}</p>
            <p className="text-xs text-slate-400">Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;

import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RoleBadge from '../components/RoleBadge';

const roles = ['USER', 'VERIFIED', 'MODERATOR', 'ADMIN', 'OWNER'];

const AdminPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [reports, setReports] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [creatorApps, setCreatorApps] = useState([]);

  const canAccess = ['MODERATOR', 'ADMIN', 'OWNER'].includes(user?.role);
  const canManageUsers = ['ADMIN', 'OWNER'].includes(user?.role);

  const loadUsers = async () => canManageUsers && setUsers((await api.get(`/admin/users?q=${encodeURIComponent(query)}`)).data.users || []);
  const loadMangas = async () => setMangas((await api.get(`/admin/mangas?q=${encodeURIComponent(query)}&status=${statusFilter}`)).data.mangas || []);
  const loadReports = async () => {
    const { data } = await api.get('/admin/reports');
    setReports(data.reports || []);
    setOpenCount(data.openCount || 0);
  };
  const loadCreatorApps = async () => canManageUsers && setCreatorApps((await api.get('/admin/creator-applications')).data.users || []);

  useEffect(() => {
    if (!canAccess) return;
    loadMangas();
    loadReports();
    loadUsers();
    loadCreatorApps();
  }, [user?.role]);

  if (!canAccess) return <Navigate to="/" replace />;

  const updateRole = async (targetUserId, role) => {
    await api.patch(`/admin/users/${targetUserId}/role`, { role });
    toast.success('Role updated');
    loadUsers();
  };

  const changeMangaModeration = async (mangaId, action) => {
    const reason = action === 'hide' || action === 'ban' ? window.prompt('Reason') || '' : undefined;
    await api.post(`/admin/mangas/${mangaId}/${action}`, reason !== undefined ? { reason } : {});
    toast.success(`Manga ${action}d`);
    loadMangas();
  };

  const resolveReport = async (id) => {
    await api.post(`/admin/reports/${id}/resolve`);
    loadReports();
  };

  const allowedRoles = useMemo(() => {
    if (user?.role === 'OWNER') return roles;
    if (user?.role === 'ADMIN') return roles.filter((r) => r !== 'OWNER');
    return ['USER'];
  }, [user?.role]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin panel</h1>
      <div className="flex flex-wrap gap-2">
        {canManageUsers && <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'users' ? 'bg-indigo-500' : 'bg-slate-800'}`} onClick={() => setTab('users')}>Users</button>}
        <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'mangas' ? 'bg-indigo-500' : 'bg-slate-800'}`} onClick={() => setTab('mangas')}>Mangas</button>
        <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'reports' ? 'bg-indigo-500' : 'bg-slate-800'}`} onClick={() => setTab('reports')}>Reports ({openCount})</button>
        {canManageUsers && <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'creator' ? 'bg-indigo-500' : 'bg-slate-800'}`} onClick={() => setTab('creator')}>Creator Applications</button>}
      </div>

      {(tab === 'users' || tab === 'mangas') && <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (tab === 'users' ? loadUsers() : loadMangas())} placeholder={`Search ${tab}...`} className="w-full max-w-md rounded-lg bg-slate-900 p-2" />}
      {tab === 'mangas' && <select className="rounded bg-slate-900 p-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All status</option><option value="ACTIVE">ACTIVE</option><option value="HIDDEN">HIDDEN</option><option value="BANNED">BANNED</option></select>}

      {tab === 'users' && canManageUsers && users.map((u) => (
        <div key={u._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="text-sm">{u.username} <RoleBadge role={u.role} /></div>
          <select value={u.role} onChange={(e) => updateRole(u._id, e.target.value)} className="rounded bg-slate-800 p-1 text-xs">{allowedRoles.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
      ))}

      {tab === 'mangas' && mangas.map((manga) => (
        <div key={manga._id} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center md:justify-between">
          <div><p className="font-semibold">{manga.title}</p><p className="text-xs text-slate-400">{manga.moderation?.status} • by {manga.uploaderName}</p></div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => api.patch(`/admin/mangas/${manga._id}`, { title: window.prompt('Title', manga.title) || manga.title }).then(loadMangas)} className="rounded bg-indigo-500/20 px-2 py-1">Edit</button>
            <button onClick={() => changeMangaModeration(manga._id, 'hide')} className="rounded bg-amber-500/20 px-2 py-1">Hide</button>
            <button onClick={() => changeMangaModeration(manga._id, 'unhide')} className="rounded bg-emerald-500/20 px-2 py-1">Unhide</button>
            <button onClick={() => changeMangaModeration(manga._id, 'ban')} className="rounded bg-rose-500/20 px-2 py-1">Ban</button>
            <button onClick={() => api.post(`/admin/mangas/${manga._id}/remove-thumbnail`).then(loadMangas)} className="rounded bg-slate-700 px-2 py-1">Remove thumbnail</button>
            <button onClick={() => api.delete(`/admin/mangas/${manga._id}`).then(loadMangas)} className="rounded bg-rose-700/40 px-2 py-1">Delete</button>
          </div>
        </div>
      ))}

      {tab === 'reports' && reports.map((report) => (
        <div key={report._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
          <div>{report.type} / {report.status} — {report.reason}</div>
          {report.status === 'OPEN' && <button onClick={() => resolveReport(report._id)} className="rounded bg-emerald-500/20 px-2 py-1 text-xs">Resolve</button>}
        </div>
      ))}

      {tab === 'creator' && canManageUsers && creatorApps.map((entry) => (
        <div key={entry._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
          <div>{entry.username} — {entry.creatorBadge?.status} <span className="text-xs text-slate-400">{entry.creatorBadge?.message}</span></div>
          <div className="space-x-2">
            <button onClick={() => api.post(`/admin/creator-applications/${entry._id}/approve`).then(loadCreatorApps)} className="rounded bg-emerald-500/20 px-2 py-1 text-xs">Approve</button>
            <button onClick={() => api.post(`/admin/creator-applications/${entry._id}/reject`, { note: window.prompt('Rejection note') || '' }).then(loadCreatorApps)} className="rounded bg-rose-500/20 px-2 py-1 text-xs">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPage;

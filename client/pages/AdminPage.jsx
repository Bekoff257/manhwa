import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RoleBadge from '../components/RoleBadge';

const roles = ['USER', 'VERIFIED', 'MODERATOR', 'ADMIN', 'OWNER'];

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null);
  const [banForm, setBanForm] = useState({ permanent: true, durationMinutes: 60, reason: '' });
  const [editManga, setEditManga] = useState(null);

  const canAccess = ['MODERATOR', 'ADMIN', 'OWNER'].includes(user?.role);
  const canManageUsers = ['ADMIN', 'OWNER'].includes(user?.role);

  const fetchUsers = async (q = '') => {
    if (!canManageUsers) return;
    const { data } = await api.get(`/admin/users?q=${encodeURIComponent(q)}`);
    setUsers(data.users);
  };

  const fetchMangas = async (q = '') => {
    const { data } = await api.get(`/admin/mangas?q=${encodeURIComponent(q)}`);
    setMangas(data.mangas);
  };

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    Promise.all([fetchMangas(), fetchUsers()]).finally(() => setLoading(false));
  }, [user?.role]);

  if (!canAccess) return <Navigate to="/" replace />;

  const updateRole = async (targetUserId, role) => {
    try {
      await api.patch(`/admin/users/${targetUserId}/role`, { role });
      toast.success('Role updated');
      fetchUsers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Role update failed');
    }
  };

  const submitBan = async () => {
    try {
      await api.post(`/admin/users/${banTarget._id}/ban`, {
        durationMinutes: banForm.permanent ? null : Number(banForm.durationMinutes || 0),
        reason: banForm.reason
      });
      toast.success('User banned');
      setBanTarget(null);
      fetchUsers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ban failed');
    }
  };

  const unbanUser = async (id) => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      toast.success('User unbanned');
      fetchUsers(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unban failed');
    }
  };

  const toggleHide = async (manga) => {
    const reason = manga.moderation?.hidden ? undefined : window.prompt('Reason for hiding (optional)') || '';
    const endpoint = manga.moderation?.hidden ? 'unhide' : 'hide';
    try {
      await api.post(`/manga/${manga._id}/${endpoint}`, reason !== undefined ? { reason } : {});
      toast.success(`Manga ${endpoint}d`);
      fetchMangas(query);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${endpoint}`);
    }
  };

  const saveManga = async () => {
    try {
      await api.patch(`/manga/${editManga._id}`, {
        title: editManga.title,
        description: editManga.description,
        tags: editManga.tags?.join(', ') || '',
        status: editManga.status
      });
      toast.success('Manga updated');
      setEditManga(null);
      fetchMangas(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const removeManga = async (id) => {
    if (!window.confirm('Delete this manga and its files?')) return;
    try {
      await api.delete(`/manga/${id}`);
      toast.success('Manga deleted');
      fetchMangas(query);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const allowedRoles = useMemo(() => {
    if (user?.role === 'OWNER') return roles;
    if (user?.role === 'ADMIN') return roles.filter((r) => r !== 'OWNER');
    return ['USER'];
  }, [user?.role]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin panel</h1>

      <div className="flex gap-2">
        {canManageUsers && (
          <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'users' ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`} onClick={() => setTab('users')}>
            Users
          </button>
        )}
        <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'mangas' ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`} onClick={() => setTab('mangas')}>
          Mangas
        </button>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (tab === 'users' ? fetchUsers(query) : fetchMangas(query))} placeholder={`Search ${tab}...`} className="w-full max-w-md rounded-lg bg-slate-900 p-2" />

      {loading ? (
        <div className="grid gap-3">{Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-900" />)}</div>
      ) : tab === 'users' && canManageUsers ? (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-300"><tr><th className="p-3">User</th><th>Role</th><th>Ban</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-800">
                  <td className="p-3">{u.username} <RoleBadge role={u.role} /></td>
                  <td>
                    <select value={u.role} onChange={(e) => updateRole(u._id, e.target.value)} className="rounded bg-slate-800 p-1" disabled={!canManageUsers}>
                      {allowedRoles.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{u.ban?.isBanned ? `Banned${u.ban.until ? ` until ${new Date(u.ban.until).toLocaleString()}` : ' permanently'}` : 'Active'}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => setBanTarget(u)} className="rounded bg-rose-500/20 px-2 py-1 text-xs">Ban</button>
                    {u.ban?.isBanned && <button onClick={() => unbanUser(u._id)} className="rounded bg-emerald-500/20 px-2 py-1 text-xs">Unban</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3">
          {mangas.map((manga) => (
            <div key={manga._id} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{manga.title}</p>
                <p className="text-xs text-slate-400">by {manga.uploaderName} • {manga.status}</p>
                {manga.moderation?.hidden && <p className="text-xs text-rose-300">Hidden: {manga.moderation.hiddenReason || 'No reason'}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditManga({ ...manga })} className="rounded bg-indigo-500/20 px-2 py-1 text-xs">Edit</button>
                <button onClick={() => toggleHide(manga)} className="rounded bg-amber-500/20 px-2 py-1 text-xs">{manga.moderation?.hidden ? 'Unhide' : 'Hide'}</button>
                <button onClick={() => removeManga(manga._id)} className="rounded bg-rose-500/20 px-2 py-1 text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(banTarget)} title={`Ban ${banTarget?.username || ''}`} onClose={() => setBanTarget(null)}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={banForm.permanent} onChange={(e) => setBanForm({ ...banForm, permanent: e.target.checked })} /> Permanent ban
          </label>
          {!banForm.permanent && (
            <input type="number" min="1" className="w-full rounded bg-slate-800 p-2" value={banForm.durationMinutes} onChange={(e) => setBanForm({ ...banForm, durationMinutes: e.target.value })} placeholder="Duration (minutes)" />
          )}
          <textarea className="w-full rounded bg-slate-800 p-2" value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} placeholder="Reason" />
          <button onClick={submitBan} className="rounded bg-rose-500 px-4 py-2 text-sm">Confirm Ban</button>
        </div>
      </Modal>

      <Modal open={Boolean(editManga)} title="Edit manga" onClose={() => setEditManga(null)}>
        {editManga && (
          <div className="space-y-3">
            <input className="w-full rounded bg-slate-800 p-2" value={editManga.title || ''} onChange={(e) => setEditManga({ ...editManga, title: e.target.value })} />
            <textarea className="w-full rounded bg-slate-800 p-2" value={editManga.description || ''} onChange={(e) => setEditManga({ ...editManga, description: e.target.value })} />
            <input className="w-full rounded bg-slate-800 p-2" value={Array.isArray(editManga.tags) ? editManga.tags.join(', ') : ''} onChange={(e) => setEditManga({ ...editManga, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            <select className="w-full rounded bg-slate-800 p-2" value={editManga.status || 'ONGOING'} onChange={(e) => setEditManga({ ...editManga, status: e.target.value })}>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="HIATUS">HIATUS</option>
            </select>
            <button onClick={saveManga} className="rounded bg-indigo-500 px-4 py-2 text-sm">Save</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPage;

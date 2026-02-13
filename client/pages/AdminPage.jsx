import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RoleBadge from '../components/RoleBadge';

const roles = ['USER', 'VERIFIED', 'MODERATOR', 'ADMIN', 'OWNER'];

const AdminPage = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);

  const fetchUsers = async (q = '') => {
    const { data } = await api.get(`/admin/users?q=${q}`);
    setUsers(data.users);
  };

  useEffect(() => {
    if (['ADMIN', 'OWNER'].includes(user?.role)) fetchUsers();
  }, [user]);

  if (!['ADMIN', 'OWNER'].includes(user?.role)) return <Navigate to="/" replace />;

  const changeRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    toast.success('Role updated');
    fetchUsers(query);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers(query)} placeholder="Search users..." className="w-full max-w-sm rounded-lg bg-slate-900 p-2" />
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300"><tr><th className="p-3">User</th><th>Role</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-800">
                <td className="p-3">{u.username} <RoleBadge role={u.role} /></td>
                <td>{u.role}</td>
                <td className="p-3">
                  <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="rounded bg-slate-800 p-1">
                    {roles.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;

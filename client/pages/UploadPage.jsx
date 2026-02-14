import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UploadPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', author: '', genres: '', tags: '', status: 'ONGOING' });
  const [pdf, setPdf] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  if (!user) return <Navigate to="/auth" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!pdf || pdf.type !== 'application/pdf') return toast.error('Please upload a PDF');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('pdf', pdf);
    fd.append('thumbnail', thumbnail);

    try {
      await api.post('/manga', fd, {
        onUploadProgress: (evt) => setProgress(Math.round((evt.loaded * 100) / evt.total))
      });
      toast.success('Manga uploaded');
      setProgress(0);
    } catch (error) {
      const data = error.response?.data;
      const banHint = data?.until || data?.reason ? ` (${data.reason || 'No reason'}${data.until ? `, until ${new Date(data.until).toLocaleString()}` : ', permanent'})` : '';
      toast.error((data?.message || 'Upload failed') + banHint);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-xl font-semibold">Upload Manga</h1>
      <input required placeholder="Title" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Author" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, author: e.target.value })} />
      <textarea placeholder="Description" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input placeholder="Genres comma separated" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, genres: e.target.value })} />
      <input placeholder="Tags comma separated" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      <select className="w-full rounded-lg bg-slate-800 p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="ONGOING">ONGOING</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="HIATUS">HIATUS</option>
      </select>
      <input required type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
      <input required type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} />
      <div className="h-2 overflow-hidden rounded bg-slate-800"><div className="h-full bg-indigo-400" style={{ width: `${progress}%` }} /></div>
      <button className="rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-400">Upload</button>
    </form>
  );
};

export default UploadPage;

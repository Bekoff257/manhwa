import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UploadPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', author: '', genres: '' });
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
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-xl font-semibold">Upload Manga</h1>
      <input required placeholder="Title" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Description" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input placeholder="Author" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, author: e.target.value })} />
      <input placeholder="Genres comma separated" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, genres: e.target.value })} />
      <input required type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
      <input required type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} />
      <div className="h-2 overflow-hidden rounded bg-slate-800"><div className="h-full bg-indigo-400" style={{ width: `${progress}%` }} /></div>
      <button className="rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-400">Upload</button>
    </form>
  );
};

export default UploadPage;

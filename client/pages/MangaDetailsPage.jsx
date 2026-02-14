import { useEffect, useState } from 'react';
import { Heart, Play, Eye, Flag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import CreatorBadge from '../components/CreatorBadge';

const MangaDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [manga, setManga] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [libraryStatus, setLibraryStatus] = useState('PLANNED');
  const [progressPage, setProgressPage] = useState(0);

  const load = async () => {
    const [{ data: mangaData }, { data: likeData }] = await Promise.all([api.get(`/manga/${id}`), api.get(`/manga/${id}/like`)]);
    setManga(mangaData.manga);
    setLiked(likeData.liked);
    setLikesCount(likeData.likesCount || 0);
    await api.post(`/manga/${id}/view`);
    if (user) {
      const [lib, prog] = await Promise.all([api.get('/library'), api.get(`/progress/${id}`)]);
      const libItem = (lib.data.items || []).find((item) => item.mangaId === id || item.mangaId?._id === id);
      if (libItem) setLibraryStatus(libItem.status);
      setProgressPage(prog.data.page || 0);
    }
  };

  useEffect(() => {
    load();
  }, [id, user?.uid]);

  if (!manga) return <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-8">Loading manga...</div>;

  const toggleLike = async () => {
    if (!user) return toast.error('Login required');
    const { data } = await api.post(`/manga/${id}/like`);
    setLiked(data.liked);
    setLikesCount(data.likesCount);
  };

  const updateLibrary = async (status) => {
    setLibraryStatus(status);
    await api.post(`/library/${id}`, { status });
    toast.success('Library updated');
  };

  const report = async () => {
    const reason = window.prompt('Reason for report');
    if (!reason) return;
    await api.post(`/manga/${id}/report`, { reason });
    toast.success('Manga report submitted');
  };

  const reportUser = async () => {
    if (!manga.uploaderId?._id) return;
    const reason = window.prompt('Reason for reporting uploader');
    if (!reason) return;
    await api.post(`/reports/user/${manga.uploaderId._id}`, { reason });
    toast.success('User report submitted');
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[240px,1fr]">
        <img src={manga.thumbnailUrl || 'https://placehold.co/600x800?text=No+thumb'} alt={manga.title} className="h-80 w-full rounded-2xl object-cover" />
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{manga.title}</h1>
          <p className="text-sm text-slate-300">{manga.description}</p>
          <p className="text-sm text-slate-400">By {manga.author || manga.uploaderName}</p>
          <div className="flex flex-wrap gap-2 text-xs">{(manga.genres || []).map((g) => <span key={g} className="rounded-full bg-slate-800 px-2 py-1">{g}</span>)}{(manga.tags || []).map((g) => <span key={g} className="rounded-full bg-indigo-500/20 px-2 py-1">#{g}</span>)}</div>
          <div className="flex items-center gap-2"><RoleBadge role={manga.uploaderId?.role} /><CreatorBadge creatorBadge={manga.uploaderId?.creatorBadge} /></div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1"><Eye size={14} /> {manga.views || 0}</span>
            <button onClick={toggleLike} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 ${liked ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900'}`}><Heart size={14} /> {likesCount}</button>
            <Link to={`/reader/${manga._id}`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1"><Play size={14} /> Start Reading</Link>
            {progressPage > 1 && <Link to={`/reader/${manga._id}?resume=1`} className="rounded-lg bg-emerald-500/20 px-3 py-1">Continue Reading (page {progressPage})</Link>}
            {user && <button onClick={report} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1"><Flag size={14} /> Report Manga</button>}
            {user && <button onClick={reportUser} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1"><Flag size={14} /> Report Uploader</button>}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Library:</span>
              <select value={libraryStatus} onChange={(e) => updateLibrary(e.target.value)} className="rounded-lg bg-slate-800 p-2 text-sm">
                <option value="PLANNED">Planned</option>
                <option value="READING">Reading</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MangaDetailsPage;

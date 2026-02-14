import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import MangaCard from '../components/MangaCard';
import SkeletonGrid from '../components/SkeletonGrid';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', genre: '', tag: '', author: '' });

  const load = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/manga/search?${query}`);
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const genres = useMemo(() => [...new Set(items.flatMap((m) => m.genres || []))].slice(0, 20), [items]);
  const tags = useMemo(() => [...new Set(items.flatMap((m) => m.tags || []))].slice(0, 20), [items]);

  if (loading) return <SkeletonGrid />;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="text-sm text-slate-400">Search by title, author, tags, and genres.</p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 md:grid-cols-4">
        <input value={filters.q} onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))} placeholder="Search title / tag / genre" className="rounded-lg bg-slate-800 p-2 text-sm" />
        <input value={filters.author} onChange={(e) => setFilters((s) => ({ ...s, author: e.target.value }))} placeholder="Author" className="rounded-lg bg-slate-800 p-2 text-sm" />
        <select value={filters.genre} onChange={(e) => setFilters((s) => ({ ...s, genre: e.target.value }))} className="rounded-lg bg-slate-800 p-2 text-sm"><option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select>
        <div className="flex gap-2">
          <select value={filters.tag} onChange={(e) => setFilters((s) => ({ ...s, tag: e.target.value }))} className="flex-1 rounded-lg bg-slate-800 p-2 text-sm"><option value="">All tags</option>{tags.map((g) => <option key={g}>{g}</option>)}</select>
          <button onClick={load} className="rounded-lg bg-indigo-500 px-3 text-sm">Apply</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => <span key={k} className="rounded-full bg-slate-800 px-2 py-1">{k}: {v}</span>)}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">No mangas found. Try removing some filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((manga) => <MangaCard key={manga._id} manga={manga} />)}
        </div>
      )}
    </section>
  );
};

export default HomePage;

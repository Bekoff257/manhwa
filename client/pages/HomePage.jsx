import { useEffect, useState } from 'react';
import api from '../services/api';
import MangaCard from '../components/MangaCard';
import SkeletonGrid from '../components/SkeletonGrid';

const HomePage = () => {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await api.get('/manga?page=1&limit=12');
      setData(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid />;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Trending uploads</h1>
        <p className="text-sm text-slate-400">Fresh chapters and community favorites.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((manga) => (
          <MangaCard key={manga._id} manga={manga} />
        ))}
      </div>
    </section>
  );
};

export default HomePage;

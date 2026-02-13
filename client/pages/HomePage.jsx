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

  return loading ? (
    <SkeletonGrid />
  ) : (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trending uploads</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.items.map((manga) => (
          <MangaCard key={manga._id} manga={manga} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;

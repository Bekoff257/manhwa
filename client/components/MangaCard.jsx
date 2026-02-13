import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge';

const MangaCard = ({ manga }) => (
  <motion.div whileHover={{ y: -4 }} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-soft">
    <Link to={`/reader/${manga._id}`}>
      <img src={manga.thumbnailUrl} alt={manga.title} className="h-56 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-white">{manga.title}</h3>
        <p className="line-clamp-2 text-xs text-slate-400">{manga.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">@{manga.uploadedBy?.username}</span>
          <RoleBadge role={manga.uploadedBy?.role} />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default MangaCard;

import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import CreatorBadge from './CreatorBadge';

const MangaCard = ({ manga }) => {
  const uploader = manga.uploaderId || {};

  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-soft">
      <Link to={`/manga/${manga._id}`} className="flex h-full flex-col">
        <img src={manga.thumbnailUrl || 'https://placehold.co/600x800?text=No+thumb'} alt={manga.title} className="h-56 w-full object-cover" />
        <div className="flex h-full flex-col space-y-2 p-4">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{manga.title}</h3>
          <p className="line-clamp-2 flex-1 text-xs text-slate-400">{manga.description}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1"><Eye size={13} /> {manga.views || 0}</span>
            <span className="inline-flex items-center gap-1"><Heart size={13} /> {manga.likesCount || 0}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">@{uploader.username || manga.uploaderName}</span>
            <RoleBadge role={uploader.role} />
            <CreatorBadge creatorBadge={uploader.creatorBadge} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MangaCard;

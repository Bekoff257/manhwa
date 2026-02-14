import { Sparkles } from 'lucide-react';

const CreatorBadge = ({ creatorBadge }) => {
  if (creatorBadge?.status !== 'APPROVED') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300 ring-1 ring-fuchsia-400/50">
      <Sparkles size={10} /> CREATOR
    </span>
  );
};

export default CreatorBadge;

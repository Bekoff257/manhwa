import { Check } from 'lucide-react';
import { useRoleBadge } from '../hooks/useRoleBadge';

const RoleBadge = ({ role }) => {
  const badge = useRoleBadge(role);
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}>
      <Check size={10} /> {badge.label}
    </span>
  );
};

export default RoleBadge;

const badgeStyles = {
  OWNER: 'bg-amber-500/20 text-amber-300 ring-amber-400/50',
  ADMIN: 'bg-purple-500/20 text-purple-300 ring-purple-400/50',
  MODERATOR: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/50',
  VERIFIED: 'bg-sky-500/20 text-sky-300 ring-sky-400/50'
};

export const useRoleBadge = (role) => {
  if (!role || role === 'USER') return null;
  return { label: role, className: badgeStyles[role] || badgeStyles.VERIFIED };
};

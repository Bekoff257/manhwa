const badgeStyles = {
  OWNER: 'bg-purple-500/20 text-purple-300 ring-purple-500/40',
  ADMIN: 'bg-blue-500/20 text-blue-300 ring-blue-500/40',
  MODERATOR: 'bg-green-500/20 text-green-300 ring-green-500/40',
  VERIFIED: 'bg-amber-500/20 text-amber-300 ring-amber-500/40'
};

export const useRoleBadge = (role) => {
  if (!role || role === 'USER') return null;
  return { label: role, className: badgeStyles[role] || badgeStyles.VERIFIED };
};

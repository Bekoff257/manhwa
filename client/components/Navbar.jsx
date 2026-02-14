import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import RoleBadge from './RoleBadge';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Discover', show: true },
    { to: '/upload', label: 'Upload', show: Boolean(user) },
    { to: '/admin', label: 'Admin', show: ['MODERATOR', 'ADMIN', 'OWNER'].includes(user?.role) }
  ].filter((link) => link.show);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-white">
          InkScroll
        </Link>

        <button className="rounded-lg p-2 text-slate-200 md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

        <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="transition hover:text-white">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          {user ? (
            <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 shadow-soft">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} className="h-7 w-7 rounded-full" />
              <span className="text-xs text-slate-200">{user.username}</span>
              <RoleBadge role={user.role} />
              <button onClick={logout} className="text-xs text-rose-300 hover:text-rose-200">
                Logout
              </button>
            </motion.div>
          ) : (
            <Link to="/auth" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              Login
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          <div className="mb-3 flex flex-col gap-3 text-sm text-slate-300">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </div>
          {user ? (
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
              <div className="flex items-center gap-2">
                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} className="h-7 w-7 rounded-full" />
                <span className="text-xs">{user.username}</span>
                <RoleBadge role={user.role} />
              </div>
              <button onClick={logout} className="text-xs text-rose-300">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="inline-block rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

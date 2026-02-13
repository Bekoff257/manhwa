import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import RoleBadge from './RoleBadge';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-white">InkScroll</Link>
        <nav className="flex items-center gap-5 text-sm text-slate-300">
          <NavLink to="/" className="hover:text-white">Discover</NavLink>
          {user && <NavLink to="/upload" className="hover:text-white">Upload</NavLink>}
          {['ADMIN', 'OWNER'].includes(user?.role) && <NavLink to="/admin" className="hover:text-white">Admin</NavLink>}
        </nav>
        <div>
          {user ? (
            <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 shadow-soft">
              <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + user.username} className="h-7 w-7 rounded-full" />
              <span className="text-xs text-slate-200">{user.username}</span>
              <RoleBadge role={user.role} />
              <button onClick={logout} className="text-xs text-rose-300 hover:text-rose-200">Logout</button>
            </motion.div>
          ) : (
            <Link to="/auth" className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

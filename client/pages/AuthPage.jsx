import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { user, login, signup, loginWithGoogle } = useAuth();

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) await signup(form);
      else await login(form);
      toast.success('Welcome back');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-soft">
      <h1 className="mb-6 text-xl font-semibold">{isSignup ? 'Create account' : 'Sign in'}</h1>
      <form onSubmit={submit} className="space-y-3">
        {isSignup && <input required placeholder="Username" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, username: e.target.value })} />}
        <input required type="email" placeholder="Email" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Password" className="w-full rounded-lg bg-slate-800 p-2" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded-lg bg-indigo-500 p-2 font-medium hover:bg-indigo-400">Continue</button>
      </form>
      <button onClick={loginWithGoogle} className="mt-3 w-full rounded-lg bg-white/10 p-2 text-sm hover:bg-white/20">Continue with Google</button>
      <button onClick={() => setIsSignup((s) => !s)} className="mt-3 text-sm text-slate-400">
        {isSignup ? 'Already have an account?' : 'Need an account?'}
      </button>
    </div>
  );
};

export default AuthPage;

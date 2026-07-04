import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

export default function Login() {
  const [email, setEmail] = useState('admin@starnetcore.local');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0d14] p-4">
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { token } = await api.login(email, password);
          setToken(token);
          nav('/');
        } catch (ex) { setErr(ex.message); }
      }} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d111c] p-10 shadow-2xl">
        <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">StarNet Core</h1>
        <p className="mt-2 text-sm text-slate-400">Панель адміністратора · аналог AinurPOS</p>
        {err && <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
        <input className="mt-6 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white">Увійти</button>
      </form>
    </div>
  );
}

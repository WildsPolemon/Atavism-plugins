import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ainur-bg p-4">
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { token } = await api.login(email, password);
          setToken(token);
          nav('/');
        } catch (ex) { setErr(ex.message); }
      }} className="w-full max-w-md rounded-xl border border-ainur-border bg-white p-10 shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ainur-blue text-2xl font-bold text-white">S</div>
        <h1 className="text-center text-2xl font-bold text-ainur-text">StarNet Core</h1>
        <p className="mt-2 text-center text-sm text-ainur-muted">Панель адміністратора · аналог AinurPOS</p>
        {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <input className="mt-6 w-full rounded-lg border border-ainur-border px-4 py-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="mt-3 w-full rounded-lg border border-ainur-border px-4 py-3 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" />
        <button className="mt-6 w-full rounded-lg bg-ainur-blue py-3 text-sm font-semibold text-white hover:bg-ainur-blue-dark">Увійти</button>
      </form>
    </div>
  );
}

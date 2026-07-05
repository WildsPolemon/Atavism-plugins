import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { api, setToken } from '../api';

export default function Login() {
  const [email, setEmail] = useState('admin@starnetcore.local');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ainur-bg p-4">
      <form onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr('');
        try {
          const { token } = await api.login(email, password);
          setToken(token);
          nav('/');
        } catch (ex) {
          setErr(ex.message);
        } finally {
          setBusy(false);
        }
      }} className="w-full max-w-md rounded-xl border border-ainur-border bg-white p-10 shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ainur-blue text-2xl font-bold text-white">S</div>
        <h1 className="text-center text-2xl font-bold text-ainur-text">StarNet Core</h1>
        <p className="mt-2 text-center text-sm text-ainur-muted">Панель адміністратора</p>
        {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <label className="mt-6 block text-xs font-medium text-ainur-muted">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="inp mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        <label className="mt-4 block text-xs font-medium text-ainur-muted">Пароль</label>
        <div className="relative mt-1">
          <input
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            className="inp pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ainur-muted hover:text-ainur-text"
            tabIndex={-1}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-ainur-blue py-3 text-sm font-semibold text-white hover:bg-ainur-blue-dark disabled:opacity-50"
        >
          Увійти
        </button>
      </form>
    </div>
  );
}

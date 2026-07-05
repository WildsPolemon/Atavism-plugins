import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, setToken } from './api';
import Login from './pages/Login';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockHub from './pages/StockHub';
import CashShifts from './pages/CashShifts';
import MoneyFlow from './pages/MoneyFlow';
import Counterparties from './pages/Counterparties';
import Reports from './pages/Reports';
import Estore from './pages/Estore';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Plans from './pages/Plans';

function Guard({ children }) {
  const [ok, setOk] = useState(null);
  useEffect(() => { api.me().then(() => setOk(true)).catch(() => setOk(false)); }, []);
  if (ok === null) return <div className="flex h-screen items-center justify-center bg-ainur-bg"><div className="h-8 w-8 animate-spin rounded-full border-2 border-ainur-blue border-t-transparent" /></div>;
  return ok ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="cash" element={<CashShifts />} />
        <Route path="stock" element={<StockHub />} />
        <Route path="money" element={<MoneyFlow />} />
        <Route path="partners" element={<Counterparties />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="estore" element={<Estore />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="plans" element={<Plans />} />
        {/* legacy redirects */}
        <Route path="warehouse" element={<Navigate to="/stock?tab=stock" replace />} />
        <Route path="purchases" element={<Navigate to="/stock?tab=purchases" replace />} />
        <Route path="inventory" element={<Navigate to="/stock?tab=inventory" replace />} />
        <Route path="price-tags" element={<Navigate to="/stock?tab=tags" replace />} />
        <Route path="suppliers" element={<Navigate to="/partners?tab=suppliers" replace />} />
        <Route path="crm" element={<Navigate to="/partners?tab=customers" replace />} />
        <Route path="stores" element={<Navigate to="/partners?tab=stores" replace />} />
      </Route>
    </Routes>
  );
}

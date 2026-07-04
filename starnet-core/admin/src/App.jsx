import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, setToken } from './api';
import Login from './pages/Login';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Warehouse from './pages/Warehouse';
import CRM from './pages/CRM';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Stores from './pages/Stores';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import PriceTags from './pages/PriceTags';
import Estore from './pages/Estore';
import Settings from './pages/Settings';

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
        <Route path="warehouse" element={<Warehouse />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="price-tags" element={<PriceTags />} />
        <Route path="estore" element={<Estore />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="stores" element={<Stores />} />
        <Route path="crm" element={<CRM />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

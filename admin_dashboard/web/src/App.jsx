import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Online from './pages/Online';
import Logins from './pages/Logins';
import Registrations from './pages/Registrations';
import Accounts from './pages/Accounts';
import Server from './pages/Server';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="online" element={<Online />} />
        <Route path="logins" element={<Logins />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="server" element={<Server />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

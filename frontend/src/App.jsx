import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Servidores from './pages/Servidores';
import AddServer from './pages/AddServer';
import Ferias from './pages/Ferias';
import Relatorios from './pages/Relatorios';
import Calendario from './pages/Calendario';
import Configuracoes from './pages/Configuracoes';
import Afastamentos from './pages/Afastamentos';
import Help from './pages/Help';
import ChangePassword from './pages/ChangePassword';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servidores" element={<Servidores />} />
            <Route path="/adicionar-servidor" element={<AddServer />} />
            <Route path="/adicionar-servidor/:id" element={<AddServer />} />
            <Route path="/ferias" element={<Ferias />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/afastamentos" element={<Afastamentos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/ajuda" element={<Help />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

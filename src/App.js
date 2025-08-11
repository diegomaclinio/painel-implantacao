// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PrivateLayout from './components/PrivateLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ClienteDetalhesPage from './pages/ClienteDetalhesPage';
import MetricsPage from './pages/MetricsPage';
import UsuariosPage from './pages/UsuariosPage';
import AlertasPage from './pages/AlertasPage';
import AgendaPage from './pages/AgendaPage';
import './App.css';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/cliente/:clienteId" element={<ClienteDetalhesPage />} />
            <Route path="/metricas" element={<MetricsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
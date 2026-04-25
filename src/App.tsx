// SIMANTAB - Main Application Component
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Anggota } from './pages/admin/Anggota';
import { Absensi } from './pages/admin/Absensi';
import { AbsensiRiwayat } from './pages/admin/AbsensiRiwayat';
import { AbsensiRekap } from './pages/admin/AbsensiRekap';
import { Tabungan } from './pages/admin/Tabungan';
import { Setoran } from './pages/admin/Setoran';
import { Penarikan } from './pages/admin/Penarikan';
import { MemberLogin } from './pages/member/MemberLogin';
import { AdminLogin } from './pages/admin/AdminLogin';
import { Jadwal } from './pages/admin/Jadwal';
import { Pengaturan } from './pages/admin/Pengaturan';

import { KeuanganPengurus } from './pages/admin/KeuanganPengurus';
import { KeuanganMedia } from './pages/admin/KeuanganMedia';

import { MemberLayout } from './layouts/MemberLayout';
import { Dashboard as MemberDashboard } from './pages/member/Dashboard';
import { Absensi as MemberAbsensi } from './pages/member/Absensi';
import { Tabungan as MemberTabungan } from './pages/member/Tabungan';
import { Pengaturan as MemberPengaturan } from './pages/member/Pengaturan';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/member/login" replace />} />
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Member Protected Routes */}
          <Route path="/member" element={
            <ProtectedRoute allowedRole="member">
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MemberDashboard />} />
            <Route path="absensi" element={<MemberAbsensi />} />
            <Route path="savings" element={<MemberTabungan />} />
            <Route path="pengaturan" element={<MemberPengaturan />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<Anggota />} />
            <Route path="absensi" element={<Absensi />} />
            <Route path="absensi-riwayat" element={<AbsensiRiwayat />} />
            <Route path="absensi-rekap" element={<AbsensiRekap />} />
            <Route path="savings" element={<Tabungan />} />
            <Route path="setoran" element={<Setoran />} />
            <Route path="penarikan" element={<Penarikan />} />
            <Route path="keuangan-pengurus" element={<KeuanganPengurus />} />
            <Route path="keuangan-media" element={<KeuanganMedia />} />
            <Route path="jadwal" element={<Jadwal />} />
            <Route path="pengaturan" element={<Pengaturan />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/member/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

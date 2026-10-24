import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar, Footer } from './layouts/Layout';
import { HomePage } from './pages/HomePage';
import { PaintingsPage } from './pages/PaintingsPage';
import { WallPaintingPage } from './pages/WallPaintingPage';
import { CustomPotteryPage } from './pages/CustomPotteryPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomerRoute, AdminRoute } from './components/ProtectedRoutes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/paintings" element={<PaintingsPage />} />
              <Route path="/wall-painting" element={<WallPaintingPage />} />
              <Route path="/custom-pottery" element={<CustomPotteryPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Customer Routes */}
              <Route element={<CustomerRoute />}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/StateViews';

export const CustomerRoute = () => {
  const { user, loading, isCustomer } = useAuth();

  if (loading) return <LoadingState message="Checking authorization..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/admin" replace />;

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingState message="Checking studio credentials..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

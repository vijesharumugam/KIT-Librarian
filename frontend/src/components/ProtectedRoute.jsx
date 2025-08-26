import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Protect admin routes by verifying presence and validity of admin token
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login', { replace: true, state: { from: location } });
          return;
        }
        // Validate token with a lightweight protected endpoint
        const res = await api.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        if (!isMounted) return;
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login', { replace: true, state: { from: location } });
          return;
        }
        setAllowed(true);
      } catch (_) {
        // On network or other error, be safe and redirect to login
        localStorage.removeItem('adminToken');
        navigate('/admin/login', { replace: true, state: { from: location } });
      } finally {
        if (isMounted) setChecking(false);
      }
    };
    check();
    return () => { isMounted = false; };
  }, [navigate, location]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}

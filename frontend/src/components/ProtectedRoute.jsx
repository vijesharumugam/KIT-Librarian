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
        console.log('ProtectedRoute: Checking admin token:', !!token);
        
        if (!token) {
          console.log('ProtectedRoute: No token found, redirecting to admin login');
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            console.log('Mobile detected, using window.location for admin login redirect');
            window.location.href = '/admin/login';
          } else {
            navigate('/admin/login', { replace: true, state: { from: location } });
          }
          return;
        }
        
        // Validate token with a lightweight protected endpoint
        console.log('ProtectedRoute: Validating token with /api/admin/stats');
        const res = await api.get('/api/admin/stats', {
          validateStatus: () => true, // Don't let axios throw on 401
        });
        
        console.log('ProtectedRoute: Token validation response:', res.status);
        
        if (!isMounted) return;
        if (res.status === 401) {
          console.log('ProtectedRoute: Token invalid (401), redirecting to admin login');
          // Token might already be removed by API interceptor
          localStorage.removeItem('adminToken');
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            console.log('Mobile detected, using window.location for admin login redirect');
            window.location.href = '/admin/login';
          } else {
            navigate('/admin/login', { replace: true, state: { from: location } });
          }
          return;
        }
        console.log('ProtectedRoute: Token valid, allowing access');
        setAllowed(true);
      } catch (err) {
        console.error('ProtectedRoute: Error during token validation:', err);
        // On network or other error, be safe and redirect to login
        localStorage.removeItem('adminToken');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('Mobile detected, using window.location for admin login redirect');
          window.location.href = '/admin/login';
        } else {
          navigate('/admin/login', { replace: true, state: { from: location } });
        }
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

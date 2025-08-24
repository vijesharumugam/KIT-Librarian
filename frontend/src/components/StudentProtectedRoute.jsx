import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Protect student routes by verifying session via HttpOnly cookie (studentToken)
export default function StudentProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Call a lightweight protected endpoint to verify cookie/session
        const res = await fetch('http://localhost:5000/api/student/current', {
          credentials: 'include',
        });
        if (!isMounted) return;
        if (res.status === 401) {
          navigate('/student/login', { replace: true, state: { from: location } });
          return;
        }
        setAllowed(true);
      } catch (_) {
        navigate('/student/login', { replace: true, state: { from: location } });
      } finally {
        if (isMounted) setChecking(false);
      }
    })();
    return () => { isMounted = false; };
  }, [navigate, location]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}

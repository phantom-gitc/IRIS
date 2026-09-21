import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../services/api/auth.api';

export const ProtectedRoute: React.FC = () => {
  const { status, setStatus, accessToken } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    if (status === 'unknown') {
      const initAuth = async () => {
        try {
          if (!accessToken) {
            await authApi.refresh();
          }
          if (isMounted) {
            await authApi.getMe();
          }
        } catch {
          if (isMounted) {
            setStatus('unauthenticated');
          }
        }
      };

      initAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [status, setStatus, accessToken]);

  if (status === 'unknown') {
    return (
      <div className="min-h-screen w-screen bg-[#04060a] flex items-center justify-center select-none font-['Poppins']">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">Connecting to IRIS...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useAuthStore } from './store/useAuthStore';

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authenticated session if access token exists in localStorage
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

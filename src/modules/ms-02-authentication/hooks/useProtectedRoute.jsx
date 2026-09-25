import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';
import LoadingScreen from '../../../shared/utils/LoadingScreen.jsx';
import { ROUTE_CHANGE_PASSWORD } from '../config/index.js';

export const useProtectedRoute = () => {
  const { isAuthenticated, loading, mustChangePassword, sessionRestored } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    if (loading || !sessionRestored) return;

    const currentPath = location.pathname + location.search;

    if (isAuthenticated && mustChangePassword && location.pathname !== ROUTE_CHANGE_PASSWORD) {
      navigate(ROUTE_CHANGE_PASSWORD, {
        state: { from: currentPath },
        replace: true,
      });
      return;
    }

    if (!isAuthenticated) {

      navigate('/login', {
        state: { from: currentPath },
        replace: true
      });
    }
  }, [isAuthenticated, loading, sessionRestored, mustChangePassword]);

  return { isAuthenticated, loading: loading || !sessionRestored };
};

export const usePublicRoute = () => {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {

      if (mustChangePassword) {
        navigate(ROUTE_CHANGE_PASSWORD, { replace: true });
      } else {

        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate]);

  return { isAuthenticated, loading };
};

export const withAuth = (WrappedComponent) => {
  return function ProtectedComponent(props) {
    const { isAuthenticated, loading } = useProtectedRoute();

    if (loading) {
      return null; // Redirección instantánea sin loading
    }

    if (!isAuthenticated) {
      return null; // La redirección se maneja en useProtectedRoute
    }

    return <WrappedComponent {...props} />;
  };
};

export const withPublicAuth = (WrappedComponent) => {
  return function PublicComponent(props) {
    const { isAuthenticated, loading } = usePublicRoute();

    if (loading) {
      // Mostrar pantalla de carga SIPREB mientras se verifica la sesión
      return <LoadingScreen isLoading={true} message="Verificando sesión..." />;
    }

    if (isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default useProtectedRoute;

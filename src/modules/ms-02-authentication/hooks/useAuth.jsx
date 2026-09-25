import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import { getMunicipalityId } from "../../../shared/utils/municipalityHelper.js";
import { normalizeRoles } from "../../../shared/utils/roleUtils.js";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const useAuthState = () => {

  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {

    const checkAuth = () => {
      try {
        setError(null);

        const currentToken = authService.getToken();
        const currentUser = authService.getCurrentUser();

        const legacyCleaned = sessionStorage.getItem('legacy_cleaned_v7');
        if (!legacyCleaned) {
          sessionStorage.setItem('legacy_cleaned_v7', 'true');
        }

        if (currentToken && currentUser) {
          const restoredUser = {
            ...currentUser,
            roles: normalizeRoles(currentUser.roles || []),
            municipalCode:
              currentUser.municipalCode ||
              sessionStorage.getItem('municipalCode') ||
              getMunicipalityId() ||
              null,
          };
          sessionStorage.setItem('user', JSON.stringify(restoredUser));
          authService.syncFromStorage();
          setUser(restoredUser);
          setToken(currentToken);
        }
      } catch (err) {

        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          clearSession();
        }
      } finally {
        setSessionRestored(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tokenType');
    sessionStorage.removeItem('expiresIn');
    sessionStorage.removeItem('authMode');
    sessionStorage.removeItem('municipalCode');
    setSessionRestored(true);
  };

  const refreshUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(credentials);

      if (result.success) {
        setUser(result.user);
        setToken(result.token);
        setSessionRestored(true);
        
        // 🔍 Verificación adicional de municipalityId después del login
        console.log('🔍 Verificación post-login en useAuth...');
        const municipalityId = getMunicipalityId();
        
        if (municipalityId) {
          console.log('✅ MunicipalityId verificado en useAuth:', municipalityId);
        } else {
          console.warn('⚠️ MunicipalityId no disponible en useAuth');
        }
        
        return result;
      } else {
        throw new Error("Error al iniciar sesion");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.logout();
      setUser(null);
      setToken(null);
      setSessionRestored(false);

      return { success: true };
    } catch (err) {
      setError(err.message);
      setUser(null);
      setToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      return await authService.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const result = await authService.updateProfile(profileData);

      if (result.success) {
        setUser(result.user);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      return await authService.requestPasswordReset(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (resetToken, newPassword) => {
    try {
      setError(null);
      return await authService.resetPassword(resetToken, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!(token && user),
    mustChangePassword: !!user?.requiresPasswordReset,
    sessionRestored,
    login,
    logout,
    refreshUserData,
    changePassword,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    clearError: () => setError(null),
  };
};

export default useAuth;


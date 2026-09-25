import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext, useAuthState } from "../hooks/useAuth";
export const AuthProvider = ({ children }) => {
  const auth = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();



  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

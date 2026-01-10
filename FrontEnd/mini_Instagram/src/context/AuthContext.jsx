import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching current user
          const response = await authAPI.getMe();
          if (response.success) {
            setUser(response.data.user);
            localStorage.setItem("user", JSON.stringify(response.data.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      register: async ({ name, email, password }) => {
        try {
          const response = await authAPI.register({ name, email, password });
          
          if (response.success) {
            const { user: userData, token } = response.data;
            
            // Store token and user
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            
            return userData;
          } else {
            throw new Error(response.message || "Registration failed");
          }
        } catch (error) {
          throw new Error(error.message || "Registration failed");
        }
      },
      
      login: async ({ email, password }) => {
        try {
          const response = await authAPI.login({ email, password });
          
          if (response.success) {
            const { user: userData, token } = response.data;
            
            // Store token and user
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            
            return userData;
          } else {
            throw new Error(response.message || "Login failed");
          }
        } catch (error) {
          throw new Error(error.message || "Invalid email or password");
        }
      },
      
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

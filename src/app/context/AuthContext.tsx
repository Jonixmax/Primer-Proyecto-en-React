"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  // Agregamos este estado para controlar la espera del localStorage
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Buscamos si hay sesión al cargar la app
    const userGuardado = localStorage.getItem("userSession");
    
    if (userGuardado) {
      try {
        setUser(JSON.parse(userGuardado));
      } catch (error) {
        console.error("Error al parsear la sesión:", error);
        localStorage.removeItem("userSession");
      }
    }
    
    // 2. IMPORTANTE: Una vez que revisamos (haya o no usuario), dejamos de cargar
    setLoading(false);
  }, []);

  const login = (datosUsuario: any) => {
    setUser(datosUsuario);
    localStorage.setItem("userSession", JSON.stringify(datosUsuario));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userSession");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, // Exportamos loading para que page.tsx lo use
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
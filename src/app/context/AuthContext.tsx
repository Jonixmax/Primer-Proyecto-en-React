"use client";
import { createContext, useContext, useState, useEffect } from "react";


const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userGuardado = localStorage.getItem("userSession");
    if (userGuardado) {
      setUser(JSON.parse(userGuardado));
    }
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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
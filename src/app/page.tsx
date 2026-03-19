"use client";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext"; 

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Llamamos a nuestra base de datos simulada
      const respuesta = await axios.get("http://localhost:3001/users");
      const usuarios = respuesta.data;

      // 2. Buscamos si existe un usuario con esas credenciales
      const usuarioEncontrado = usuarios.find(
        (u: any) => u.username === username && u.password === password
      );

      if (usuarioEncontrado) {
        // 3. Si existe, le decimos al guardia que lo deje pasar
        login(usuarioEncontrado);
        alert(`¡Bienvenido ${usuarioEncontrado.role}!`);
        // Más adelante aquí lo enviaremos al Dashboard
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      setError("Error al conectar con la base de datos. ¿Encendiste el JSON Server?");
    }
  };

  // Si el usuario ya inició sesión, le mostramos un mensaje de bienvenida temporal
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-black">¡Hola, {user.username}!</h1>
        <p className="text-lg mb-4 text-black">Tu rol es: <span className="font-bold text-blue-600">{user.role}</span></p>
        <p className="text-gray-600">Pronto crearemos el Dashboard aquí.</p>
      </div>
    );
  }

  // Si no ha iniciado sesión, mostramos el formulario
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Usuario</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
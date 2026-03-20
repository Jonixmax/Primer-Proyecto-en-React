"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext"; 

interface Proyecto {
  id: string | number;
  name: string;
  description: string;
  progress: number;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [proyectos, setProyectos] = useState<Proyecto[]>([]); 
  
  // --- NUEVOS ESTADOS PARA CREAR PROYECTO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState({ name: "", description: "" });

  const { login, logout, user } = useAuth();

  useEffect(() => {
    if (user) {
      const cargarProyectos = async () => {
        try {
          const respuesta = await axios.get("http://localhost:3001/projects");
          setProyectos(respuesta.data);
        } catch (error) {
          console.error("Error al cargar los proyectos", error);
        }
      };
      cargarProyectos();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const respuesta = await axios.get("http://localhost:3001/users");
      const usuarios = respuesta.data;

      const usuarioEncontrado = usuarios.find(
        (u: any) => u.username === username && u.password === password
      );

      if (usuarioEncontrado) {
        login(usuarioEncontrado);
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      setError("Error al conectar con la base de datos. ¿Encendiste el JSON Server?");
    }
  };

  // --- FUNCIÓN PARA GUARDAR EL NUEVO PROYECTO ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Preparamos los datos (JSON Server le pondrá el ID automáticamente)
      // Iniciamos el progreso en 0% por defecto
      const datosProyecto = {
        name: nuevoProyecto.name,
        description: nuevoProyecto.description,
        progress: 0
      };

      // Hacemos el POST a la base de datos simulada
      const respuesta = await axios.post("http://localhost:3001/projects", datosProyecto);

      // Agregamos el nuevo proyecto a la lista que ya vemos en pantalla (sin recargar la página)
      setProyectos([...proyectos, respuesta.data]);

      // Cerramos el modal y limpiamos el formulario
      setIsModalOpen(false);
      setNuevoProyecto({ name: "", description: "" });
      
    } catch (error) {
      console.error("Error al crear proyecto", error);
      alert("Hubo un problema al crear el proyecto.");
    }
  };


  // --- VISTA PROTEGIDA: DASHBOARD ---
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 relative">
        <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
            <p className="text-gray-600">
              Bienvenido, <span className="font-semibold">{user.username}</span> | Rol: <span className="text-blue-600 font-bold uppercase">{user.role}</span>
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Botón modificado para que abra el Modal */}
            {user.role === "gerente" && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-200"
              >
                + Crear Nuevo Proyecto
              </button>
            )}
            
            <button 
              onClick={() => logout()} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.length > 0 ? (
            proyectos.map((proyecto) => (
              <div key={proyecto.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{proyecto.name}</h3>
                <p className="text-gray-600 mb-4">{proyecto.description}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${proyecto.progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-500 font-bold">{proyecto.progress}% completado</p>
                
                {user.role === "gerente" && (
                  <div className="mt-4 flex gap-2">
                    <button className="text-sm text-blue-500 hover:text-blue-700 font-semibold">Editar</button>
                    <button className="text-sm text-red-500 hover:text-red-700 font-semibold">Eliminar</button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No hay proyectos disponibles. ¡Crea uno nuevo!</p>
          )}
        </div>

        {/* --- MODAL PARA CREAR PROYECTO --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Nuevo Proyecto</h2>
              
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Nombre del Proyecto</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-green-500"
                    value={nuevoProyecto.name}
                    onChange={(e) => setNuevoProyecto({ ...nuevoProyecto, name: e.target.value })}
                    required
                    placeholder="Ej. Rediseño de la App"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-green-500"
                    value={nuevoProyecto.description}
                    onChange={(e) => setNuevoProyecto({ ...nuevoProyecto, description: e.target.value })}
                    required
                    rows={3}
                    placeholder="Describe los objetivos del proyecto..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA PÚBLICA: FORMULARIO DE LOGIN ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* ... (El formulario de login se mantiene exactamente igual que antes) ... */}
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
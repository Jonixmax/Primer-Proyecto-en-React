"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// --- INTERFACES ---
interface Proyecto {
  id: string | number;
  name: string;
  description: string;
  progress: number;
}

interface Tarea {
  id: string | number;
  projectId: string | number;
  title: string;
  status: string;
  assignedTo: string;
}

interface Usuario {
  id: string;
  username: string;
  role: string;
}

export default function DashboardPage() {
  const { login, logout, user } = useAuth();

  // Estados de Login/Registro
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados de Datos
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Estados de Modales y Formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proyectoActual, setProyectoActual] = useState<Partial<Proyecto>>({ id: undefined, name: "", description: "", progress: 0 });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [nuevaTarea, setNuevaTarea] = useState({ title: "", assignedTo: "" });

  // Carga inicial de datos al detectar usuario
  useEffect(() => {
    if (user) {
      const cargarDatos = async () => {
        try {
          const resP = await axios.get("http://localhost:3001/projects");
          setProyectos(resP.data);
          const resU = await axios.get("http://localhost:3001/users");
          setUsuarios(resU.data);
        } catch (err) {
          console.error("Error cargando datos:", err);
        }
      };
      cargarDatos();
    }
  }, [user]);

  // --- LÓGICA DE ACCESO ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.get("http://localhost:3001/users");
      const u = res.data.find((userItem: any) => userItem.username === username && userItem.password === password);
      if (u) {
        login(u);
        setUsername("");
        setPassword("");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch { setError("Error al conectar con el servidor."); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const resExistentes = await axios.get("http://localhost:3001/users");
      if (resExistentes.data.some((u: any) => u.username === username)) {
        setError("El usuario ya existe.");
        return;
      }
      const res = await axios.post("http://localhost:3001/users", { username, password, role: "usuario" });
      login(res.data);
    } catch { setError("Error al crear cuenta."); }
  };

  // --- LÓGICA DE PROYECTOS ---
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (proyectoActual.id) {
        const res = await axios.put(`http://localhost:3001/projects/${proyectoActual.id}`, proyectoActual);
        setProyectos(proyectos.map(p => p.id === proyectoActual.id ? res.data : p));
      } else {
        const res = await axios.post("http://localhost:3001/projects", { ...proyectoActual, progress: 0 });
        setProyectos([...proyectos, res.data]);
      }
      setIsModalOpen(false);
    } catch { alert("Error al guardar proyecto."); }
  };

  const handleDeleteProject = async (id: string | number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    try {
      await axios.delete(`http://localhost:3001/projects/${id}`);
      setProyectos(proyectos.filter(p => p.id !== id));
    } catch { alert("Error al eliminar."); }
  };

  // --- LÓGICA DE TAREAS Y PROGRESO ---
  const calcularYGuardarProgreso = async (projectId: string | number, listaTareas: Tarea[]) => {
    const porcentaje = listaTareas.length === 0
      ? 0
      : Math.round((listaTareas.filter(t => t.status === "completada").length / listaTareas.length) * 100);

    try {
      await axios.patch(`http://localhost:3001/projects/${projectId}`, { progress: porcentaje });
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, progress: porcentaje } : p));
    } catch (err) { console.error(err); }
  };

  const abrirModalTareas = async (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    try {
      const res = await axios.get(`http://localhost:3001/tasks?projectId=${proyecto.id}`);
      setTareas(res.data);
      setIsTaskModalOpen(true);
    } catch { alert("Error al cargar tareas."); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) return;
    try {
      const nuevaT = {
        projectId: String(proyectoSeleccionado.id),
        title: nuevaTarea.title,
        status: "pendiente",
        assignedTo: nuevaTarea.assignedTo
      };
      const res = await axios.post("http://localhost:3001/tasks", nuevaT);
      const listaActualizada = [...tareas, res.data];
      setTareas(listaActualizada);
      setNuevaTarea({ title: "", assignedTo: "" });
      await calcularYGuardarProgreso(proyectoSeleccionado.id, listaActualizada);
    } catch { alert("Error al crear tarea."); }
  };

  const handleChangeTaskStatus = async (tarea: Tarea) => {
    const nuevoEstado = tarea.status === "pendiente" ? "completada" : "pendiente";
    try {
      const res = await axios.patch(`http://localhost:3001/tasks/${tarea.id}`, { status: nuevoEstado });
      const listaActualizada = tareas.map(t => t.id === tarea.id ? res.data : t);
      setTareas(listaActualizada);
      await calcularYGuardarProgreso(tarea.projectId, listaActualizada);
    } catch { alert("Error al actualizar tarea."); }
  };

  // --- RENDERIZADO DEL DASHBOARD (DISEÑO A MANO) ---
  if (user) {
    return (
      <div className="flex min-h-screen bg-gray-100 font-sans text-black">

        {/* SIDEBAR */}
        <aside className="w-64 bg-black text-white flex flex-col p-6 border-r-4 border-black">
          <div className="mb-10">
            <h2 className="text-2xl font-black italic border-b-2 border-blue-600 pb-2">PROJECT MANAGER</h2>
          </div>

          <nav className="flex-1 space-y-4">
            <button className="w-full text-left font-bold hover:text-blue-400 uppercase">Inicio</button>
            <button className="w-full text-left font-bold hover:text-blue-400 uppercase">Tareas Asignadas</button>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Sesión activa</p>
            <p className="font-bold mb-4 truncate">{user.username}</p>
            <button onClick={() => logout()} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded border-b-4 border-red-900">
              CERRAR SESIÓN
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-8 overflow-y-auto">

          <header className="flex justify-between items-end mb-10 border-b-4 border-black pb-4">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Panel de Control</h1>
              <p className="font-bold text-gray-700 uppercase">Rol: <span className="text-blue-700">{user.role}</span></p>
            </div>
            {user.role === "gerente" && (
              <button
                onClick={() => { setProyectoActual({ name: "", description: "" }); setIsModalOpen(true); }}
                className="bg-green-600 text-white font-black py-3 px-6 border-b-4 border-green-900 hover:bg-green-700 transition"
              >
                + NUEVO PROYECTO
              </button>
            )}
          </header>

          {/* TARJETAS DE PROYECTOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {proyectos.map((p) => (
              <div key={p.id} className="bg-white border-4 border-black p-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-2 uppercase italic">{p.name}</h3>
                <p className="text-sm font-bold text-gray-800 mb-4 h-12 overflow-hidden">{p.description}</p>

                <div className="flex justify-between text-xs font-black mb-1 uppercase">
                  <span>Progreso</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-6 border-2 border-black mb-4">
                  <div className="bg-blue-600 h-full border-r-2 border-black" style={{ width: `${p.progress}%` }}></div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => abrirModalTareas(p)}
                    className="bg-black text-white text-xs font-black px-4 py-2 uppercase hover:bg-gray-800"
                  >
                    Ver Tareas
                  </button>
                  {user.role === "gerente" && (
                    <div className="ml-auto flex gap-3">
                      <button onClick={() => { setProyectoActual(p); setIsModalOpen(true); }} className="text-xs font-black text-blue-700 hover:underline">EDITAR</button>
                      <button onClick={() => handleDeleteProject(p.id)} className="text-xs font-black text-red-600 hover:underline">ELIMINAR</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* GRÁFICO REAL */}
          <section className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-8 uppercase italic border-b-2 border-black inline-block">Rendimiento General</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proyectos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                  <XAxis dataKey="name" stroke="#000" fontSize={12} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#000" fontSize={12} fontWeight="bold" tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: '#eee' }} contentStyle={{ border: '4px solid black', fontWeight: 'bold' }} />
                  <Bar dataKey="progress" radius={[0, 0, 0, 0]}>
                    {proyectos.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.progress > 75 ? '#16a34a' : '#2563eb'} stroke="#000" strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </main>

        {/* MODAL PROYECTOS */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-black p-8 w-full max-w-md shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black mb-6 uppercase italic">{proyectoActual.id ? "Editar" : "Nuevo"} Proyecto</h2>
              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-black uppercase mb-1">Nombre</label>
                  <input type="text" className="w-full p-2 border-2 border-black font-bold outline-none" value={proyectoActual.name} onChange={e => setProyectoActual({ ...proyectoActual, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase mb-1">Descripción</label>
                  <textarea className="w-full p-2 border-2 border-black font-bold outline-none" rows={3} value={proyectoActual.description} onChange={e => setProyectoActual({ ...proyectoActual, description: e.target.value })} required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="font-black uppercase text-sm hover:underline">Cancelar</button>
                  <button type="submit" className="bg-black text-white px-6 py-2 font-black uppercase border-b-4 border-gray-700">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAREAS */}
        {isTaskModalOpen && proyectoSeleccionado && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-black p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-2xl font-black uppercase italic">Tareas: {proyectoSeleccionado.name}</h2>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-3xl font-black hover:text-red-600">&times;</button>
              </div>

              {user.role === "gerente" && (
                <form onSubmit={handleCreateTask} className="mb-10 bg-gray-100 p-5 border-2 border-black">
                  <h3 className="font-black uppercase text-sm mb-4">Asignar Nueva Tarea</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="TÍTULO" className="flex-1 p-2 border-2 border-black font-bold text-black placeholder-gray-500 outline-none" value={nuevaTarea.title} onChange={e => setNuevaTarea({ ...nuevaTarea, title: e.target.value })} required />
                    <select className="p-2 border-2 border-black bg-white font-bold text-black outline-none" value={nuevaTarea.assignedTo} onChange={e => setNuevaTarea({ ...nuevaTarea, assignedTo: e.target.value })} required>
                      <option value="">ASIGNAR A...</option>
                      {usuarios.filter(u => u.role === "usuario").map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                    <button type="submit" className="bg-blue-600 text-white px-6 font-black uppercase border-b-4 border-blue-900">Crear</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {tareas.filter(t => user.role === "gerente" || t.assignedTo === user.id).map(tarea => (
                  <div key={tarea.id} className="flex justify-between items-center p-4 border-2 border-black bg-white hover:bg-yellow-50">
                    <div>
                      <p className={`font-black uppercase ${tarea.status === "completada" ? "line-through text-gray-400" : "text-black"}`}>{tarea.title}</p>
                      {user.role === "gerente" && (
                        <p className="text-xs font-bold text-gray-600 uppercase">Responsable ID: {tarea.assignedTo}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleChangeTaskStatus(tarea)}
                      className={`text-xs font-black px-4 py-2 border-2 border-black uppercase transition ${tarea.status === "completada" ? "bg-green-500" : "bg-yellow-400"}`}
                    >
                      {tarea.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- LOGIN / REGISTRO ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-300 p-4">
      <div className="bg-white p-10 border-4 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <h2 className="text-4xl font-black mb-10 text-center uppercase italic tracking-tighter">
          {isRegistering ? "Registro" : "Login"}
        </h2>
        {error && <p className="bg-red-100 border-2 border-red-600 text-red-600 font-bold p-2 mb-6 text-center text-sm">{error}</p>}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Usuario</label>
            <input type="text" className="w-full p-3 border-4 border-black font-black outline-none focus:bg-yellow-50" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Contraseña</label>
            <input type="password" className="w-full p-3 border-4 border-black font-black outline-none focus:bg-yellow-50" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-black text-white font-black py-4 uppercase text-lg border-b-8 border-gray-800 hover:translate-y-1 hover:border-b-4 transition-all">
            {isRegistering ? "Crear Cuenta" : "Entrar al Sistema"}
          </button>
        </form>

        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
          className="w-full mt-8 text-xs font-black uppercase hover:underline tracking-widest"
        >
          {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
        </button>
      </div>
    </div>
  );
}
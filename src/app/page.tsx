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
  createdAt: string;
  dueDate: string;
  completedAt: string | null;
}

interface Usuario {
  id: string;
  username: string;
  role: string;
}

export default function DashboardPage() {
  const { login, logout, user, loading } = useAuth();

  // Estados de Login/Registro
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados de Datos
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [todasLasTareas, setTodasLasTareas] = useState<Tarea[]>([]);
  const [vistaActual, setVistaActual] = useState<"proyectos" | "mis-tareas" | "usuarios">("proyectos");

  // Estados de Modales y Formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proyectoActual, setProyectoActual] = useState<Partial<Proyecto>>({ id: undefined, name: "", description: "", progress: 0 });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [nuevaTarea, setNuevaTarea] = useState({ title: "", assignedTo: "", dueDate: "" });
  
  // ESTADO PARA EDICIÓN DE TAREAS
  const [tareaEditandoId, setTareaEditandoId] = useState<string | number | null>(null);

  // Componente Tooltip personalizado para la gráfica
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const proyecto = proyectos.find(p => p.name === label);
      if (!proyecto) return null;

      const tareasCompletadas = todasLasTareas.filter(t =>
        t.projectId == proyecto.id && t.status === "completada"
      );

      return (
        <div className="bg-white border-4 border-black p-4 shadow-lg max-w-xs z-50">
          <p className="font-black uppercase text-lg mb-2">{label}</p>
          <p className="font-bold text-blue-600 mb-3">Progreso: {payload[0].value}%</p>

          {tareasCompletadas.length > 0 ? (
            <div>
              <p className="font-black uppercase text-sm mb-2">Completadas por:</p>
              <ul className="space-y-1">
                {tareasCompletadas.map(tarea => {
                  const usuario = usuarios.find(u => u.id === tarea.assignedTo);
                  const nombreUsuario = usuario ? usuario.username : "Desconocido";
                  return (
                    <li key={tarea.id} className="text-xs font-bold flex justify-between">
                      <span className="truncate mr-2">{tarea.title}</span>
                      <span className="text-blue-600">{nombreUsuario}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-bold text-gray-500">Sin tareas completadas</p>
          )}
        </div>
      );
    }
    return null;
  };

// Función para dibujar el botón correcto según el estado
  const renderizarBotonEstado = (tarea: Tarea) => {
    if (tarea.status === "pendiente") {
      return (
        <button onClick={() => handleChangeTaskStatus(tarea)} className="text-xs font-black px-4 py-2 border-2 border-black uppercase transition bg-yellow-400 hover:bg-yellow-500">
          Pendiente
        </button>
      );
    }
    
    if (tarea.status === "completada") {
      if (user.role === "gerente") {
        return (
          <button onClick={() => handleChangeTaskStatus(tarea)} className="text-xs font-black px-4 py-2 border-2 border-green-600 bg-green-100 text-green-700 uppercase hover:bg-green-600 hover:text-white transition">
            ✓ Validar Tarea
          </button>
        );
      } else {
        return (
          <button onClick={() => handleChangeTaskStatus(tarea)} title="Haz clic para deshacer y regresar a Pendiente" className="text-xs font-black px-4 py-2 border-2 border-blue-600 bg-blue-100 text-blue-600 uppercase hover:bg-blue-600 hover:text-white transition">
            ⏳ En Revisión
          </button>
        );
      }
    }

    // ¡NUEVO! Estado FINALIZADA
    if (user.role === "gerente") {
      return (
        <button onClick={() => handleChangeTaskStatus(tarea)} title="Reabrir tarea" className="text-xs font-black px-4 py-2 border-2 border-red-600 bg-red-100 text-red-600 uppercase hover:bg-red-600 hover:text-white transition">
          Finalizada ⟲
        </button>
      );
    } else {
      return (
        <span className="text-xs font-black px-4 py-2 border-2 border-red-600 bg-red-100 text-red-600 uppercase cursor-not-allowed">
          Finalizada
        </span>
      );
    }
  };
  // Carga inicial de datos al detectar usuario
// Carga inicial de datos al detectar usuario
  useEffect(() => {
    if (user) {
      // ¡NUEVO! Reseteamos la vista a la pestaña principal siempre que alguien inicia sesión
      setVistaActual("proyectos"); 
      
      const cargarDatos = async () => {
        try {
          const resP = await axios.get("http://localhost:3001/projects");
          setProyectos(resP.data);
          const resU = await axios.get("http://localhost:3001/users");
          setUsuarios(resU.data);
          const resT = await axios.get("http://localhost:3001/tasks");
          setTodasLasTareas(resT.data);
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
      } else setError("Usuario o contraseña incorrectos");
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
      setUsername("");
      setPassword("");
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
      //  Sumamos tanto las completadas como las finalizadas
      : Math.round((listaTareas.filter(t => t.status === "completada" || t.status === "finalizada").length / listaTareas.length) * 100);

    try {
      await axios.patch(`http://localhost:3001/projects/${projectId}`, { progress: porcentaje });
      setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, progress: porcentaje } : p));
    } catch (err) { console.error(err); }
  };

  const abrirModalTareas = async (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    setTareaEditandoId(null); // Reset edición al abrir
    setNuevaTarea({ title: "", assignedTo: "", dueDate: "" });
    try {
      const res = await axios.get(`http://localhost:3001/tasks?projectId=${proyecto.id}`);
      setTareas(res.data);
      setIsTaskModalOpen(true);
    } catch { alert("Error al cargar tareas."); }
  };

  // FUNCIÓN UNIFICADA PARA GUARDAR TAREA (CREAR O EDITAR)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoSeleccionado) return;
    
    try {
      const datosTarea = {
        projectId: String(proyectoSeleccionado.id),
        title: nuevaTarea.title,
        assignedTo: nuevaTarea.assignedTo,
        dueDate: nuevaTarea.dueDate,
      };

      if (tareaEditandoId) {
        // ACTUALIZAR (PATCH)
        const res = await axios.patch(`http://localhost:3001/tasks/${tareaEditandoId}`, datosTarea);
        const listaActualizada = tareas.map(t => t.id === tareaEditandoId ? res.data : t);
        setTareas(listaActualizada);
        setTodasLasTareas(prev => prev.map(t => t.id === tareaEditandoId ? res.data : t));
        setTareaEditandoId(null);
        await calcularYGuardarProgreso(proyectoSeleccionado.id, listaActualizada);
        alert("¡Tarea actualizada!");
      } else {
        // CREAR (POST)
        const nuevaTCompleta = {
          ...datosTarea,
          status: "pendiente",
          createdAt: new Date().toISOString().split('T')[0],
          completedAt: null
        };
        const res = await axios.post("http://localhost:3001/tasks", nuevaTCompleta);
        const listaActualizada = [...tareas, res.data];
        setTareas(listaActualizada);
        setTodasLasTareas(prev => [...prev, res.data]);
        await calcularYGuardarProgreso(proyectoSeleccionado.id, listaActualizada);
        alert("¡Tarea creada!");
      }
      setNuevaTarea({ title: "", assignedTo: "", dueDate: "" });
    } catch { alert("Error al guardar tarea."); }
  };

const handleChangeTaskStatus = async (tarea: Tarea) => {
    let nuevoEstado = tarea.status;

    // Lógica del flujo de trabajo:
    if (tarea.status === "pendiente") {
      nuevoEstado = "completada"; // Pasa a revisión
    } else if (tarea.status === "completada") {
      if (user.role === "gerente") {
        nuevoEstado = "finalizada"; // Gerente aprueba
      } else {
        nuevoEstado = "pendiente"; // Usuario la regresa
      }
    } else if (tarea.status === "finalizada" && user.role === "gerente") {
      // ¡NUEVO! Súper poder del gerente para reabrir tareas finalizadas
      nuevoEstado = "pendiente"; 
    } else {
      return; // Si es usuario normal y está finalizada, no hace nada
    }

    try {
      const actualizacion = { 
        status: nuevoEstado,
        completedAt: nuevoEstado === "completada" || nuevoEstado === "finalizada" ? new Date().toISOString().split('T')[0] : null
      };
      const res = await axios.patch(`http://localhost:3001/tasks/${tarea.id}`, actualizacion);
      
      const listaActualizada = tareas.map(t => t.id === tarea.id ? res.data : t);
      setTareas(listaActualizada);
      setTodasLasTareas(prev => prev.map(t => t.id === tarea.id ? res.data : t));
      await calcularYGuardarProgreso(tarea.projectId, listaActualizada);
    } catch { alert("Error al actualizar tarea."); }
  };

const handleDeleteTask = async (id: string | number, projectId: string | number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    try {
      // 1. Eliminamos de la base de datos
      await axios.delete(`http://localhost:3001/tasks/${id}`);
      
      // 2. Actualizamos la lista del modal
      const listaActualizada = tareas.filter(t => t.id !== id);
      setTareas(listaActualizada);

      // ¡NUEVO! 3. Actualizamos la lista maestra general
      setTodasLasTareas(prev => prev.filter(t => t.id !== id));
      
      // 4. Recalculamos el progreso del proyecto
      await calcularYGuardarProgreso(projectId, listaActualizada);
    } catch { 
      alert("Error al eliminar la tarea."); 
    }
  };

  // --- RENDERIZADO DE CARGA ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-300">
        <div className="text-2xl font-black uppercase italic animate-pulse">Cargando Sesión...</div>
      </div>
    );
  }

  // --- RENDERIZADO DEL DASHBOARD ---
  if (user) {
    return (
      <div className="flex min-h-screen bg-gray-100 font-sans text-black">

        {/* SIDEBAR */}
        <aside className="w-64 bg-black text-white flex flex-col p-6 border-r-4 border-black">
          <div className="mb-10">
            <h2 className="text-2xl font-black italic border-b-2 border-blue-600 pb-2">PROJECT MANAGER</h2>
          </div>

          <nav className="flex-1 space-y-4">
            <button onClick={() => setVistaActual("proyectos")} className={`w-full text-left font-bold uppercase ${vistaActual === "proyectos" ? "text-blue-400" : "hover:text-blue-400"}`}>Inicio</button>
            {user.role === "gerente" && (
              <button onClick={() => setVistaActual("usuarios")} className={`w-full text-left font-bold uppercase ${vistaActual === "usuarios" ? "text-blue-400" : "hover:text-blue-400"}`}>Usuarios</button>
            )}
            {user.role !== "gerente" && (
              <button onClick={() => setVistaActual("mis-tareas")} className={`w-full text-left font-bold uppercase ${vistaActual === "mis-tareas" ? "text-blue-400" : "hover:text-blue-400"}`}>Tareas Asignadas</button>
            )}
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
              <h1 className="text-4xl font-black uppercase tracking-tighter">
                {vistaActual === "proyectos" ? "Panel de Control" : vistaActual === "usuarios" ? "Gestión de Usuarios" : "Mis Tareas Asignadas"}
              </h1>
              <p className="font-bold text-gray-700 uppercase">Rol: <span className="text-blue-700">{user.role}</span></p>
            </div>
            {user.role === "gerente" && vistaActual === "proyectos" && (
              <button
                onClick={() => { setProyectoActual({ name: "", description: "" }); setIsModalOpen(true); }}
                className="bg-green-600 text-white font-black py-3 px-6 border-b-4 border-green-900 hover:bg-green-700 transition"
              >
                + NUEVO PROYECTO
              </button>
            )}
          </header>

          {vistaActual === "proyectos" ? (
            <>
{/* TARJETAS DE PROYECTOS */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {proyectos.map((p) => {
                  //  Calculamos si hay tareas esperando validación en este proyecto
                  const tareasEnRevision = todasLasTareas.filter(t => t.projectId == p.id && t.status === "completada").length;
                  
                  return (
                    // Se agregó 'relative' al final del className de este div
                    <div key={p.id} className="bg-white border-4 border-black p-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative">
                      
                      {/* GLOBO DE NOTIFICACIÓN PARA GERENTES */}
                      {user.role === "gerente" && tareasEnRevision > 0 && (
                        <div className="absolute -top-4 -right-4 bg-red-600 text-white border-2 border-black font-black px-3 py-1 animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                          {tareasEnRevision} POR VALIDAR
                        </div>
                      )}

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
                  );
                })}
              </section>

              {/* GRÁFICA REAL INTEGRADA */}
              {user.role === "gerente" && (
                <section className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-2xl font-black mb-8 uppercase italic border-b-2 border-black inline-block">Rendimiento General</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={proyectos}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                        <XAxis dataKey="name" stroke="#000" fontSize={12} fontWeight="bold" tickLine={false} />
                        <YAxis stroke="#000" fontSize={12} fontWeight="bold" tickLine={false} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="progress" radius={[0, 0, 0, 0]}>
                          {proyectos.map((entry, index) => (
                            <Cell key={`c-${index}`} fill={entry.progress > 75 ? '#16a34a' : '#2563eb'} stroke="#000" strokeWidth={2} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </>
          ) : vistaActual === "usuarios" ? (
            /* GESTIÓN DE USUARIOS */
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic border-b-2 border-black inline-block mb-8">Usuarios del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuarios.filter(u => u.role !== "gerente").map((usuario) => {
                  // Usamos el doble igual (==) para evitar problemas de ID invisible
                  const tareasUsuario = todasLasTareas.filter(t => t.assignedTo == usuario.id);
                  
                  // Contamos los 3 estados
                  const tareasPendientes = tareasUsuario.filter(t => t.status === "pendiente").length;
                  const tareasCompletadas = tareasUsuario.filter(t => t.status === "completada").length;
                  const tareasFinalizadas = tareasUsuario.filter(t => t.status === "finalizada").length;
                  
                  // Sumamos completadas + finalizadas para la barra de progreso
                  const tareasLogradas = tareasCompletadas + tareasFinalizadas;
                  const totalTareas = tareasUsuario.length;
                  
                  return (
                    <div key={usuario.id} className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black uppercase italic">{usuario.username}</h3>
                          <p className="text-sm font-bold text-gray-600 uppercase">Rol: {usuario.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-600">{totalTareas}</p>
                          <p className="text-xs font-bold uppercase">Total Tareas</p>
                        </div>
                      </div>
                      
                      {/*  LOS 3 ESTADOS EN LA TARJETA */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase text-sm">Pendientes</span>
                          <span className="bg-yellow-400 text-black font-black px-3 py-1 border-2 border-black">{tareasPendientes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase text-sm text-blue-700">En Revisión</span>
                          <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 border-2 border-blue-700">{tareasCompletadas}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase text-sm text-green-700">Finalizadas</span>
                          <span className="bg-green-500 text-white font-black px-3 py-1 border-2 border-black">{tareasFinalizadas}</span>
                        </div>
                      </div>
                      
                      {/* BARRA DE PROGRESO ARREGLADA */}
                      {totalTareas > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-black">
                          <div className="w-full bg-gray-200 h-4 border-2 border-black">
                            <div 
                              className="bg-green-500 h-full border-r-2 border-black transition-all duration-500" 
                              style={{ width: totalTareas > 0 ? `${(tareasLogradas / totalTareas) * 100}%` : '0%' }}
                            ></div>
                          </div>
                          <p className="text-xs font-bold uppercase text-center mt-2">
                            {totalTareas > 0 ? Math.round((tareasLogradas / totalTareas) * 100) : 0}% Completado
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* MIS TAREAS */
            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic border-b-2 border-black inline-block mb-8">Mis Tareas Asignadas</h2>
              {todasLasTareas.filter(t => t.assignedTo === user.id).length === 0 ? (
                <p className="text-center text-gray-500 font-bold uppercase">No tienes tareas asignadas</p>
              ) : (
                todasLasTareas.filter(t => t.assignedTo === user.id).map(tarea => {
                  const proyecto = proyectos.find(p => p.id == tarea.projectId);
                  const nombreProyecto = proyecto ? proyecto.name : "Proyecto desconocido";
                  const hoy = new Date().toISOString().split('T')[0];
                  const estaAtrasada = tarea.dueDate < hoy && tarea.status === "pendiente";

                  return (
                    <div key={tarea.id} className={`bg-white border-4 border-black p-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] ${estaAtrasada ? "bg-red-50" : ""}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black uppercase italic">{tarea.title}</h3>
                          <p className="text-sm font-bold text-gray-600 uppercase">Proyecto: {nombreProyecto}</p>
                        </div>
                        {renderizarBotonEstado(tarea)}
                      </div>
                      <p className={`text-sm font-bold uppercase ${estaAtrasada ? "text-red-600" : "text-gray-600"}`}>
                        Vencimiento: {new Date(tarea.dueDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                        {estaAtrasada && " ⚠️ ATRASADA"}
                      </p>
                    </div>
                  );
                })
              )}
            </section>
          )}

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

        {/* MODAL TAREAS RESTAURADO Y COMPLETO */}
        {isTaskModalOpen && proyectoSeleccionado && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-black p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-2xl font-black uppercase italic">Tareas: {proyectoSeleccionado.name}</h2>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-3xl font-black hover:text-red-600">&times;</button>
              </div>

              {/* FORMULARIO DE TAREAS */}
              {user.role === "gerente" && (
                <form onSubmit={handleSaveTask} className="mb-10 bg-gray-100 p-5 border-2 border-black">
                  <h3 className="font-black uppercase text-sm mb-4">
                    {tareaEditandoId ? "📝 Editar Tarea" : "➕ Asignar Nueva Tarea"}
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="TÍTULO" className="flex-1 p-2 border-2 border-black font-bold text-black placeholder-gray-500 outline-none" value={nuevaTarea.title} onChange={e => setNuevaTarea({ ...nuevaTarea, title: e.target.value })} required />
                    <select className="p-2 border-2 border-black bg-white font-bold text-black outline-none" value={nuevaTarea.assignedTo} onChange={e => setNuevaTarea({ ...nuevaTarea, assignedTo: e.target.value })} required>
                      <option value="">ASIGNAR A...</option>
                      {usuarios.filter(u => u.role === "usuario").map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                   <input type="date" min={new Date().toISOString().split('T')[0]} className="flex-1 p-2 border-2 border-black font-bold text-black outline-none" value={nuevaTarea.dueDate} onChange={e => setNuevaTarea({ ...nuevaTarea, dueDate: e.target.value })} required />
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 font-black uppercase border-b-4 border-blue-900">
                      {tareaEditandoId ? "Actualizar" : "Crear"}
                    </button>
                    {tareaEditandoId && (
                      <button 
                        type="button" 
                        onClick={() => { setTareaEditandoId(null); setNuevaTarea({ title: "", assignedTo: "", dueDate: "" }); }}
                        className="text-xs font-black uppercase underline ml-2"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* LISTA DE TAREAS */}
              <div className="space-y-4">
                {tareas.filter(t => user.role === "gerente" || t.assignedTo === user.id).map(tarea => {
                  const hoy = new Date().toISOString().split('T')[0];
                  const estaAtrasada = tarea.dueDate < hoy && tarea.status === "pendiente";
                  const responsable = usuarios.find(u => u.id === tarea.assignedTo);
                  const nombreResponsable = responsable ? responsable.username : "Desconocido";

                  return (
                    <div key={tarea.id} className={`flex justify-between items-center p-4 border-2 border-black ${estaAtrasada ? "bg-red-100" : "bg-white"} hover:bg-yellow-50`}>
                      <div className="flex-1">
                        <p className={`font-black uppercase ${tarea.status === "completada" ? "line-through text-gray-400" : "text-black"}`}>{tarea.title}</p>
                        <p className={`text-xs font-bold uppercase ${estaAtrasada ? "text-red-600" : "text-gray-600"}`}>
                         Vencimiento: {new Date(tarea.dueDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                          {estaAtrasada && " ⚠️ ATRASADA"}
                        </p>
                        {user.role === "gerente" && (
                          <p className="text-xs font-bold text-gray-600 uppercase">Responsable: {nombreResponsable}</p>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        {/* Botón Cambiar Estado */}
                       {renderizarBotonEstado(tarea)}
                        
                        {/* Botones Editar y Eliminar (Solo Gerente) */}
                        {user.role === "gerente" && (
                          <div className="flex gap-2">
                             <button
                              type="button"
                              onClick={() => {
                                setTareaEditandoId(tarea.id);
                                setNuevaTarea({ title: tarea.title, assignedTo: tarea.assignedTo, dueDate: tarea.dueDate });
                              }}
                              className="text-xs font-black text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-2 border-2 border-blue-600 transition uppercase"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(tarea.id, tarea.projectId)}
                              className="text-xs font-black text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border-2 border-red-600 transition uppercase"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
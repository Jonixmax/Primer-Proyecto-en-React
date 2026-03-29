# 🚀 Sistema de Gestión de Proyectos (Primer Proyecto en React)

Una aplicación web completa desarrollada en React y Next.js para administrar proyectos y tareas de forma eficiente. Este proyecto incluye autenticación de usuarios, sistema de roles (Gerente/Usuario) y una base de datos desplegada en la nube para persistencia de datos en tiempo real.

---

## 🛠️ Tecnologías Utilizadas
* **Frontend:** React, Next.js (App Router)
* **Estilos:** Tailwind CSS
* **Peticiones HTTP:** Axios
* **Base de Datos / Backend Fake:** JSON Server
* **Despliegue Frontend:** Vercel
* **Despliegue Backend (API):** Render

---

## ✨ Características Principales
* **Autenticación:** Sistema de Login con persistencia de sesión usando `localStorage`. Rutas protegidas para evitar accesos no autorizados.
* **Control de Roles:**
  * 👑 **Gerente:** Puede crear, editar y eliminar proyectos. Asigna tareas y tiene el poder de **Validar** tareas en revisión, marcarlas como **Finalizadas** de una vez, o **Reabrir** tareas cerradas.
  * 👤 **Usuario:** Tiene un panel personalizado donde visualiza sus tareas asignadas y puede interactuar cambiando el estado de las mismas (Pendiente ↔ En Revisión).
* **Dashboard Dinámico:** Interfaz responsiva con gráficas de progreso automatizadas, globos de notificación en tiempo real para tareas por validar, y conteo de estadísticas por usuario.

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura limpia basada en el App Router de Next.js:

```text
📦 primer-proyecto-en-react
 ┣ 📂 src
 ┃ ┣ 📂 app
 ┃ ┃ ┣ 📂 context       # Contexto global de autenticación (AuthContext.tsx)
 ┃ ┃ ┣ 📜 globals.css   # Estilos globales y configuración de Tailwind CSS
 ┃ ┃ ┣ 📜 layout.tsx    # Estructura principal y envoltura de la app
 ┃ ┃ ┗ 📜 page.tsx      # Vista principal interactiva (Dashboard, Login, Proyectos, Usuarios)
 ┣ 📜 db.json           # Base de datos JSON (Estructura de Usuarios, Proyectos y Tareas)
 ┣ 📜 package.json      # Dependencias y scripts del proyecto
 ┗ 📜 tailwind.config   # Configuración de diseño de Tailwind
```

---

## ⚙️ Cómo ejecutar la app localmente

Sigue estos pasos para correr el proyecto en tu propia máquina:

1. **Clonar el repositorio:**
   
   ```bash
   git clone [https://github.com/tu-usuario/primer-proyecto-en-react.git](https://github.com/tu-usuario/primer-proyecto-en-react.git)
   cd primer-proyecto-en-react
   ```

2. **Instalar las dependencias necesarias:**
   ```bash
   npm install
   ```

3. **Iniciar la Base de Datos Local (Terminal 1):**
   Abre una terminal y ejecuta el servidor de la base de datos simulada en el puerto 3001:
   ```bash
   npx json-server --watch db.json --port 3001
   ```

4. **Iniciar la Aplicación Web (Terminal 2):**
   Abre una nueva pestaña en tu terminal y ejecuta el entorno de desarrollo:
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador:**
   Visita `http://localhost:3000`

**🔑 Usuarios de prueba por defecto:**
* **Gerente:** Usuario: `gerente1` | Clave: `123`
* **Usuario:** Usuario: `usuario1` | Clave: `123`

---

## 📸 Capturas de Pantalla

<img width="692" height="575" alt="image" src="https://github.com/user-attachments/assets/a9420901-4408-4486-b84c-b1c269c8b5a7" />
<img width="1679" height="878" alt="image" src="https://github.com/user-attachments/assets/c54f39c6-addd-4d47-8fef-015a40bb47c1" />
<img width="1655" height="883" alt="image" src="https://github.com/user-attachments/assets/a5b3898a-39c0-4d8a-b7dc-446c59ba0762" />




### 1. Pantalla de Login
![Login]() ### 2. Dashboard del Gerente (Proyectos y Validaciones)
![Dashboard Gerente]() ### 3. Panel de Usuario (Mis Tareas Asignadas)
![Panel Usuario]() ---

## 🌐 Enlaces de Despliegue

Para garantizar el funcionamiento completo del proyecto en producción, se ha separado el entorno visual (Frontend) de la base de datos (Backend):

* 💻 **Frontend (Interfaz de Usuario):** Desplegado en Vercel.  
  👉 **Enlace:** [https://primer-proyecto-en-react-git-31a3a8-jonathans-projects-223b98a3.vercel.app/](https://primer-proyecto-en-react-git-31a3a8-jonathans-projects-223b98a3.vercel.app/)

* 🗄️ **Backend (API / Base de Datos):** La base de datos `db.json` está desplegada y corriendo en un Web Service de **Render**. Esto permite que el sistema guarde usuarios, tareas y cambios de estados en tiempo real al interactuar con la aplicación.

---

## 👥 Colaboradores y Ramas

Este proyecto cumple con la directiva de evaluación: se ha trabajado utilizando **una rama por alumno** y todos los integrantes del equipo están agregados formalmente como **colaboradores** en los ajustes del repositorio de GitHub, evidenciando sus respectivos commits.

**Equipo de Trabajo:**
* Jonathan Alexander Alberto (AC200739)
* Christian Geovanni Centeno (CS241743)
* José Alexander Montoya (MQ252529)
* Félix Gabriel Quintanilla (QR230082)



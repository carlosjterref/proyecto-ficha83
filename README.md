# Sistema de Información Académico — Colegio Yermo y Parres

Aplicación web para la gestión académica y la comunicación de una institución educativa.
Integra un sitio institucional público con portales privados diferenciados por rol
(docentes, estudiantes, acudientes y administrativos), sobre una arquitectura
cliente–servidor con **API REST**.

> Proyecto Ficha 83 — SENA · Análisis y Desarrollo de Software

---

## Tabla de contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Credenciales de prueba](#credenciales-de-prueba)
- [API REST](#api-rest)
- [Seguridad](#seguridad)
- [Repositorios](#repositorios)

---

## Características

- **Autenticación por rol** con JWT (docente, estudiante, acudiente y administrador).
  El ingreso admite indistintamente **usuario, correo o documento**.
- **Gestión de notas:** el docente registra y actualiza calificaciones por materia y periodo;
  estudiantes y acudientes las consultan.
- **Mensajería interna** entre los tres roles: enviar, recibir, responder y marcar como leído.
- **Publicaciones:** noticias/actualidad y circulares institucionales gestionadas por el administrador.
- **Plantel docente** público, agrupado por materia.
- **Registro en línea** de nuevos estudiantes junto a su acudiente (operación transaccional).
- **Consumo de API externa:** días festivos de Colombia obtenidos de la API pública
  [Nager.Date](https://date.nager.at).
- **Cambio de contraseña** por parte de cada usuario autenticado.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.3 |
| Backend | Node.js + Express 4 |
| Base de datos | MySQL (MariaDB / XAMPP) |
| Autenticación | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| Otros | mysql2, cors, dotenv, nodemon (desarrollo) |
| Versionamiento | Git / GitHub |

## Estructura del proyecto

```
Proyecto/
├── backend/                  # API REST (Node.js + Express)
│   ├── config/db.js          # Pool de conexiones MySQL
│   ├── middleware/auth.js    # Verificación de JWT y control de roles
│   ├── routes/               # Endpoints por recurso
│   ├── scripts/              # Esquema SQL y utilidades (datos de prueba, migración)
│   ├── server.js             # Punto de entrada; sirve la API y el frontend
│   └── .env                  # Variables de entorno (NO versionado)
├── frontend/                 # Sitio web estático
│   ├── css/                  # Hojas de estilo
│   ├── js/                   # Lógica de cliente (api.js + módulos por vista)
│   ├── img/                  # Recursos gráficos
│   └── *.html                # Páginas públicas, logins y portales
├── package.json              # Scripts de arranque (despliegue)
└── README.md
```

El módulo **`frontend/js/api.js`** centraliza el consumo de la API: maneja el token,
la sesión y componentes compartidos (bandeja de mensajes, comunicados, cambio de contraseña).

## Requisitos

- **Node.js 18** o superior
- **MySQL** (se recomienda [XAMPP](https://www.apachefriends.org/))
- Un navegador moderno

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlosjterref/proyecto-ficha83.git
cd proyecto-ficha83

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar las variables de entorno
cp .env.example .env      # luego edita .env con tus datos

# 4. Crear la base de datos (ver sección Base de datos)

# 5. Iniciar el servidor
npm run dev               # o: node server.js
```

Luego abre **<http://localhost:3000>** en el navegador.

> El servidor Express sirve **la API y el frontend en el mismo origen**, por lo que no
> se requiere un servidor web adicional ni configurar CORS.

## Variables de entorno

Crea el archivo `backend/.env` a partir de `backend/.env.example`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=proyecto
DB_PORT=3306

JWT_SECRET=una_clave_larga_y_aleatoria
JWT_EXPIRES_IN=8h

PORT=3000
```

## Base de datos

1. Inicia **MySQL** desde el panel de XAMPP.
2. Crea la base de datos y las 11 tablas ejecutando el esquema:

   - **Opción A (phpMyAdmin):** pega el contenido de `backend/scripts/esquema.sql`.
   - **Opción B (por consola):**
     ```bash
     node scripts/cargar-esquema.js
     ```

3. (Opcional) Carga datos de prueba:

   ```bash
   node scripts/crear-admin.js        # administrador + noticia de ejemplo
   node scripts/plantel-docentes.js   # 45 docentes del plantel
   node scripts/datos-prueba.js       # materias, notas y mensajes de ejemplo
   ```

### Modelo de datos

Once tablas relacionadas: `administrador`, `docente`, `alumno`, `padreacudiente`,
`materia`, `materia_alumno`, `nota`, `comunicacion`, `comunicacion_receptor`,
`noticia` y `circular`.

Las relaciones muchos a muchos se resuelven con tablas intermedias
(`materia_alumno` y `comunicacion_receptor`), con integridad referencial y borrado en cascada.

## Credenciales de prueba

Disponibles tras ejecutar los scripts de datos:

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | `admin` | `admin123` |
| Docente | `arodriguez` (o cualquiera del plantel) | `docente123` |
| Estudiante | `parj` | `123pau` |
| Acudiente | `mjimenez` | `acudiente123` |

## API REST

Base: `http://localhost:3000/api`

Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

### Autenticación
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Público | Inicia sesión y devuelve el token JWT |
| PUT | `/auth/password` | Autenticado | Cambia la contraseña propia |

### Académico
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| GET | `/alumnos` · `/alumnos/:id` | Autenticado | Consulta de estudiantes |
| POST · PUT · DELETE | `/alumnos` · `/alumnos/:id` | Docente | Gestión de estudiantes |
| GET | `/docentes/plantel` | **Público** | Plantel docente agrupado por materia |
| GET · POST · PUT · DELETE | `/docentes` | Autenticado / Docente | Gestión de docentes |
| GET · POST · PUT · DELETE | `/acudientes` | Docente | Gestión de acudientes |
| GET | `/materias` · `/materias/:id` · `/materias/grado/:grado` | Autenticado | Consulta de materias |
| GET | `/materias/:id/alumnos` | Autenticado | Alumnos inscritos y su nota |
| GET | `/notas/alumno/:idAlumno` | Autenticado | Notas de un estudiante |
| GET | `/notas/materia/:idMateria` | Docente | Notas por materia |
| POST · PUT · DELETE | `/notas` · `/notas/:id` | Docente | Registro y edición de notas |

### Comunicación y contenidos
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| GET | `/comunicaciones/recibidos` · `/enviados` | Autenticado | Bandeja de mensajes |
| POST | `/comunicaciones` | Autenticado | Enviar mensaje |
| PATCH | `/comunicaciones/:id/leer` | Autenticado | Marcar como leído |
| GET | `/noticias` · `/noticias/:id` | **Público** | Noticias publicadas |
| POST · PUT · DELETE | `/noticias` · `/noticias/:id` | Administrador | Gestión de noticias |
| GET | `/circulares` | **Público** | Circulares institucionales |
| POST · PUT · DELETE | `/circulares` · `/circulares/:id` | Administrador | Gestión de circulares |

### Otros
| Método | Endpoint | Acceso | Descripción |
|--------|----------|--------|-------------|
| POST | `/inscripciones` | **Público** | Registra estudiante + acudiente (transaccional) |
| GET | `/festivos` | **Público** | Festivos de Colombia (**consumo de API externa**) |
| GET | `/health` | **Público** | Estado de la API |

## Seguridad

- Contraseñas almacenadas con **hash bcrypt** (nunca en texto plano).
- **JWT** firmado con expiración configurable; el rol viaja dentro del token.
- **Autorización por rol** mediante middleware (`soloRol`).
- Operaciones sensibles (como el cambio de contraseña) usan la identidad **del token**,
  no datos enviados por el cliente.
- **Consultas parametrizadas** en todas las sentencias SQL (previene inyección SQL).
- **Escape de HTML** en el contenido dinámico del cliente (previene XSS).
- Secretos fuera del código, en variables de entorno **no versionadas**.

## Repositorios

| Repositorio | Contenido |
|-------------|-----------|
| [proyecto-ficha83](https://github.com/carlosjterref/proyecto-ficha83) | Proyecto completo (monorepo) |
| [colegio-frontend](https://github.com/carlosjterref/colegio-frontend) | Solo el cliente / sitio web |
| [colegio-backend](https://github.com/carlosjterref/colegio-backend) | Solo la API / servidor |

---

**Autor:** Carlos Terreros — Proyecto Ficha 83

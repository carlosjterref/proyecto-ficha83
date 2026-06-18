-- ============================================================
-- Rol ADMIN + sistema de NOTICIAS
-- Ejecutar en phpMyAdmin: BD "proyecto" -> pestaña SQL -> pegar -> Continuar.
-- ============================================================

-- 1. Tabla de administradores (personal no docente)
CREATE TABLE IF NOT EXISTS administrador (
  idAdmin     INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  cargo       VARCHAR(100) NULL,
  correo      VARCHAR(150) UNIQUE NULL,
  documento   VARCHAR(20)  UNIQUE NULL,
  usuario     VARCHAR(80)  UNIQUE NOT NULL,
  contrasena  VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla de noticias / actualidad / multimedia
CREATE TABLE IF NOT EXISTS noticia (
  idNoticia        INT AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(200) NOT NULL,
  contenido        TEXT NOT NULL,
  categoria        VARCHAR(50) NOT NULL DEFAULT 'Noticia',   -- Noticia | Actualidad | Multimedia
  mediaUrl         VARCHAR(500) NULL,                         -- URL de imagen o video (YouTube, etc.)
  tipoMedia        ENUM('imagen','video','ninguno') NOT NULL DEFAULT 'ninguno',
  fechaPublicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idAdmin          INT NOT NULL,
  FOREIGN KEY (idAdmin) REFERENCES administrador(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de circulares / documentación institucional (por enlace)
CREATE TABLE IF NOT EXISTS circular (
  idCircular       INT AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT NULL,
  archivoUrl       VARCHAR(500) NOT NULL,                     -- enlace al PDF/documento (Drive, etc.)
  fechaPublicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idAdmin          INT NOT NULL,
  FOREIGN KEY (idAdmin) REFERENCES administrador(idAdmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

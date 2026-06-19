-- ============================================================
-- ESQUEMA COMPLETO - Base de datos "proyecto"
-- Colegio Yermo y Parres
-- Generado desde la BD real (SHOW CREATE TABLE).
-- Uso: en phpMyAdmin crea la BD "proyecto", selecciónala,
--      pestaña SQL, pega este archivo y Continuar.
-- ============================================================

CREATE DATABASE IF NOT EXISTS proyecto DEFAULT CHARACTER SET utf8mb4;
USE proyecto;

SET FOREIGN_KEY_CHECKS = 0;

-- ----- Tabla: administrador -----
DROP TABLE IF EXISTS `administrador`;
CREATE TABLE `administrador` (
  `idAdmin` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `usuario` varchar(80) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  PRIMARY KEY (`idAdmin`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----- Tabla: docente -----
DROP TABLE IF EXISTS `docente`;
CREATE TABLE `docente` (
  `idDocente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `usuario` varchar(80) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  PRIMARY KEY (`idDocente`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: alumno -----
DROP TABLE IF EXISTS `alumno`;
CREATE TABLE `alumno` (
  `idAlumno` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `grado` int(11) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `usuario` varchar(80) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  PRIMARY KEY (`idAlumno`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: padreacudiente -----
DROP TABLE IF EXISTS `padreacudiente`;
CREATE TABLE `padreacudiente` (
  `idPadre` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `parentesco` varchar(50) DEFAULT NULL,
  `usuario` varchar(80) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `idAlumno` int(11) NOT NULL,
  PRIMARY KEY (`idPadre`),
  UNIQUE KEY `documento` (`documento`),
  UNIQUE KEY `usuario` (`usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `fk_padre_alumno` (`idAlumno`),
  CONSTRAINT `fk_padre_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `alumno` (`idAlumno`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: materia -----
DROP TABLE IF EXISTS `materia`;
CREATE TABLE `materia` (
  `idMateria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `grado` int(11) NOT NULL,
  `idDocente` int(11) NOT NULL,
  PRIMARY KEY (`idMateria`),
  KEY `idx_materia_grado` (`grado`),
  KEY `idx_materia_docente` (`idDocente`),
  CONSTRAINT `fk_materia_docente` FOREIGN KEY (`idDocente`) REFERENCES `docente` (`idDocente`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: materia_alumno -----
DROP TABLE IF EXISTS `materia_alumno`;
CREATE TABLE `materia_alumno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idMateria` int(11) NOT NULL,
  `idAlumno` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materia_alumno` (`idMateria`,`idAlumno`),
  KEY `fk_ma_alumno` (`idAlumno`),
  CONSTRAINT `fk_ma_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `alumno` (`idAlumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ma_materia` FOREIGN KEY (`idMateria`) REFERENCES `materia` (`idMateria`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: nota -----
DROP TABLE IF EXISTS `nota`;
CREATE TABLE `nota` (
  `idNota` int(11) NOT NULL AUTO_INCREMENT,
  `calificacion` float NOT NULL,
  `periodo` varchar(20) NOT NULL,
  `idAlumno` int(11) NOT NULL,
  `idMateria` int(11) NOT NULL,
  `idDocente` int(11) NOT NULL,
  PRIMARY KEY (`idNota`),
  KEY `fk_nota_docente` (`idDocente`),
  KEY `idx_nota_periodo` (`periodo`),
  KEY `idx_nota_alumno` (`idAlumno`),
  KEY `idx_nota_materia` (`idMateria`),
  CONSTRAINT `fk_nota_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `alumno` (`idAlumno`) ON UPDATE CASCADE,
  CONSTRAINT `fk_nota_docente` FOREIGN KEY (`idDocente`) REFERENCES `docente` (`idDocente`) ON UPDATE CASCADE,
  CONSTRAINT `fk_nota_materia` FOREIGN KEY (`idMateria`) REFERENCES `materia` (`idMateria`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: comunicacion -----
DROP TABLE IF EXISTS `comunicacion`;
CREATE TABLE `comunicacion` (
  `idMensaje` int(11) NOT NULL AUTO_INCREMENT,
  `contenido` text NOT NULL,
  `fechaHora` datetime NOT NULL DEFAULT current_timestamp(),
  `tipo` varchar(50) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `idEmisor` int(11) NOT NULL,
  `emisorTipo` enum('Docente','Alumno','PadreAcudiente') NOT NULL DEFAULT 'Docente',
  PRIMARY KEY (`idMensaje`),
  KEY `idx_com_emisor` (`idEmisor`),
  KEY `idx_com_fecha` (`fechaHora`),
  CONSTRAINT `fk_com_docente` FOREIGN KEY (`idEmisor`) REFERENCES `docente` (`idDocente`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: comunicacion_receptor -----
DROP TABLE IF EXISTS `comunicacion_receptor`;
CREATE TABLE `comunicacion_receptor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idMensaje` int(11) NOT NULL,
  `idReceptor` int(11) NOT NULL,
  `receptorTipo` enum('Alumno','PadreAcudiente','Docente') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mensaje_receptor` (`idMensaje`,`idReceptor`,`receptorTipo`),
  KEY `idx_cr_receptor` (`idReceptor`),
  CONSTRAINT `fk_cr_mensaje` FOREIGN KEY (`idMensaje`) REFERENCES `comunicacion` (`idMensaje`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----- Tabla: noticia -----
DROP TABLE IF EXISTS `noticia`;
CREATE TABLE `noticia` (
  `idNoticia` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `contenido` text NOT NULL,
  `categoria` varchar(50) NOT NULL DEFAULT 'Noticia',
  `mediaUrl` varchar(500) DEFAULT NULL,
  `tipoMedia` enum('imagen','video','ninguno') NOT NULL DEFAULT 'ninguno',
  `fechaPublicacion` datetime NOT NULL DEFAULT current_timestamp(),
  `idAdmin` int(11) NOT NULL,
  PRIMARY KEY (`idNoticia`),
  KEY `idAdmin` (`idAdmin`),
  CONSTRAINT `noticia_ibfk_1` FOREIGN KEY (`idAdmin`) REFERENCES `administrador` (`idAdmin`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----- Tabla: circular -----
DROP TABLE IF EXISTS `circular`;
CREATE TABLE `circular` (
  `idCircular` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `archivoUrl` varchar(500) NOT NULL,
  `fechaPublicacion` datetime NOT NULL DEFAULT current_timestamp(),
  `idAdmin` int(11) NOT NULL,
  PRIMARY KEY (`idCircular`),
  KEY `idAdmin` (`idAdmin`),
  CONSTRAINT `circular_ibfk_1` FOREIGN KEY (`idAdmin`) REFERENCES `administrador` (`idAdmin`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

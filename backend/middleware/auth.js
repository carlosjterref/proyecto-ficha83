const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, usuario, rol }
    next();
  } catch (err) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
}

function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' });
    }
    next();
  };
}

module.exports = { verificarToken, soloRol };

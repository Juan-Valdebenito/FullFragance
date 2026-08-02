function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const safeMessage = status >= 500 ? "Error interno del servidor." : (err.message || "Solicitud inválida.");
  res.status(status).json({ error: safeMessage });
}

module.exports = { notFoundHandler, errorHandler };

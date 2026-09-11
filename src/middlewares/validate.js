//corre un esquema de Zod sobre una parte del request y corta con 400 si no pasa.
//se ejecuta antes del controller, asi que los datos invalidos nunca llegan a mongo

const traducirErrores = (error) =>
  error.issues.map((issue) => ({
    campo: issue.path.join(".") || "(cuerpo)",
    mensaje: issue.message,
  }));

const validar = (origen) => (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req[origen]);

  if (!resultado.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: traducirErrores(resultado.error),
    });
  }

  //se reemplaza por el dato ya limpio: con los trim aplicados,
  //los numeros convertidos y los valores por defecto puestos
  req[origen] = resultado.data;
  next();
};

export const validateBody = validar("body");
export const validateParams = validar("params");

//el resultado va a req.consulta y no pisa req.query, para no alterar lo que mando el cliente
export const validateQuery = (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req.query);

  if (!resultado.success) {
    return res.status(400).json({
      error: "Parámetros de consulta inválidos",
      detalles: traducirErrores(resultado.error),
    });
  }

  req.consulta = resultado.data;
  next();
};

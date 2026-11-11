// Las cuentas públicas (login/registro) todavía no están abiertas: por defecto
// quedan ocultas y /login y /registro muestran AuthDisabled. Para abrirlas hay
// que poner NEXT_PUBLIC_ACCOUNTS_ENABLED="true" y redeployar el frontend.
// El panel admin no depende de esto: entra por su propio login.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true";

/** Request de inicio de sesión — alineado con LoginRequest del backend */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Respuesta de inicio de sesión — alineado con LoginResponse del backend */
export interface LoginResponse {
  token: string;
  expiresIn: number;
}

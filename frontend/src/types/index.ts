export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiStatus {
  status: string;
  service: string;
  security?: string;
  timestamp?: string;
}

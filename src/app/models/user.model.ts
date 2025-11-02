export enum UserRole {
  MANAGER = 'manager',
  EXECUTANT = 'executant',
  ADMIN = 'admin'
}

export class User {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  department?: string;
  position?: string;
  avatar?: string;
  createdAt: number;
}


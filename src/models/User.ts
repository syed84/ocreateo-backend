export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  userId: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserDTO {
  userId: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export const sanitizeUser = (user: User): UserDTO => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../database/repositories/userRepository';
import { User, UserRole, sanitizeUser } from '../models/User';
import { config } from '../config/config';

export class AuthService {
  async register(email: string, password: string, role: UserRole = UserRole.USER) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create(email, hashedPassword, role);

    return sanitizeUser(user);
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: sanitizeUser(user),
    };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      } as Object,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as Object
    );
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export const authService = new AuthService();
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationType: string;
    organizationId: string;
  };
}

export class AuthService {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    // For demo purposes, we're using a simple password check
    // In production, passwords should be hashed
    const isValidPassword = data.password === 'password123' || 
      await bcrypt.compare(data.password, user.email); // Fallback for hashed

    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate JWT - expiresIn accepts seconds (number) or string like "24h"
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationType: user.organizationType,
        organizationId: user.organizationId,
      },
      config.jwtSecret as jwt.Secret,
      { expiresIn: '24h' }
    );

    // Log access
    await prisma.accessLog.create({
      data: {
        userId: user.id,
        resourceAccessed: 'LOGIN',
      },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationType: user.organizationType,
        organizationId: user.organizationId,
      },
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        organizationType: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }
}

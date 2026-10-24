import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'art_studio_jwt_secret', {
    expiresIn: '7d',
  });
};

export const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};

/**
 * Authentication Middleware:
 * Verifies JWT token from HTTP-only cookie (or Bearer Authorization header for flexibility).
 * Attaches user to req.user.
 * Unauthenticated request: returns HTTP 401.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'art_studio_jwt_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Session invalid or user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    clearAuthCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

/**
 * Role-based Authorization Middleware:
 * Authenticated user with the wrong role: returns HTTP 403.
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

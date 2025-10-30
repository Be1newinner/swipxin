import { query } from '../config/database.js';
import { NextFunction, Request, Response } from 'express';
import { decodeToken } from '@/utils/jwt.js';
import { ExtendedError } from 'socket.io';

// JWT Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token
    const decoded = decodeToken(token);
    console.log("DECODED", decoded)
    // Get user from database
    const result = await query(
      'SELECT id, email, name, age, country, gender, preferred_gender, avatar_url, is_premium, tokens, is_online, last_seen, total_calls FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user to request object
    req.user = result.rows[0];
    next();
  } catch (error: unknown) {
    console.error('Authentication error:', error);

    if ((error as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = decodeToken(token);
      const result = await query(
        'SELECT id, email, name, age, country, gender, preferred_gender, avatar_url, is_premium, tokens, is_online, last_seen, total_calls FROM users WHERE id = $1',
        [decoded.sub]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

// Socket.IO authentication middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const socketAuth = async (socket: any, next: (err?: ExtendedError) => void) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = decodeToken(token);
    console.log("DECODED", decoded)

    const result = await query(
      'SELECT id, email, name, age, country, gender, preferred_gender, avatar_url, is_premium, tokens, is_online FROM users WHERE id = $1',
      [decoded.sub]
    );

    console.log(result.rowCount)
    console.log(result.rows[0])

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    socket.userId = result.rows[0].id;
    socket.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

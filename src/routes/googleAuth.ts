import express, { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { frontend_config } from '../config';
import { IUserDocument } from '../models/user';

const router: Router = express.Router();

// Generate JWT token
const generateToken = (user: IUserDocument): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      username: user.username 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Start Google Authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req: Request, res: Response): void => {
    try {
      const user = req.user as IUserDocument;
      if (!user) {
        res.redirect(`${frontend_config}/login?error=auth_failed`);
        return;
      }

      const token = generateToken(user);
      const userStr = encodeURIComponent(JSON.stringify({
        id: user._id,
        email: user.email,
        username: user.username
      }));

      // Make sure frontend_config doesn't end with a slash to prevent double slashes
      const frontendUrl = frontend_config.endsWith('/') 
        ? frontend_config.slice(0, -1) 
        : frontend_config;
        
      // Ensure we're using the correct path format
      res.redirect(`${frontendUrl}/dashboard?token=${token}&user=${userStr}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${frontend_config}/login?error=server_error`);
    }
  }
);

// Check session endpoint
router.get('/check-session', (req: Request, res: Response): void => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ message: 'No active session' });
      return;
    }

    const user = req.user as IUserDocument;
    if (!user) {
      res.status(401).json({ message: 'No active session' });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
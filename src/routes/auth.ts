// auth.ts
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';

const router = express.Router();

interface AuthResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

// ✅ Signup Route
router.post('/signup', async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      res.status(400).json({ message: 'Email or username already exists' });
      return;
    }

    const user = await User.create({
      email,
      username,
      password // Hashing will be handled in the User model
    });

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in environment variables!");
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    const userId = (user._id as string);

    const token = jwt.sign(
      { userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Login Route
router.post('/login', async (req: Request, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: 'This account is registered via OAuth. Please sign in with Google or Microsoft.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in environment variables!");
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    const userId = (user._id as string);

    const token = jwt.sign(
      { userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("❌ Error in login:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


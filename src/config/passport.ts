import passport from 'passport';
import dotenv from 'dotenv';
import { google_api } from '../config';

import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/user'; // Ensure correct import
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${google_api}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile: Profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            username: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err, false);
  }
});

export default passport;

import { userService } from '../services/userService.js';
import { AuthLoginSchema } from '../../../shared/schemas/authSchemas.js';

export const authController = {
  async login(req, res, next) {
    try {
      const parseResult = AuthLoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const message = parseResult.error.issues[0]?.message || 'Invalid login data';
        return res.status(400).json({ error: message });
      }
      const { username, password, rememberMe } = parseResult.data;

      const user = await userService.findByUsername(username);
      
      if (!user || !user.status) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await userService.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      // Set session expiry based on remember me (default to true)
      const shouldRemember = rememberMe !== false && rememberMe !== 'false';
      if (shouldRemember) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
      } else {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 2; // 2 hours
      }

      // Save session before sending response so the session cookie is set reliably.
      // Prevent caching so Set-Cookie is not lost (e.g. by a proxy).
      req.session.save((err) => {
        if (err) return next(err);
        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.json({ success: true, message: 'Logged out successfully' });
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAuth(req, res, next) {
    try {
      if (req.session && req.session.userId) {
        const user = await userService.findById(req.session.userId);
        if (user && user.status) {
          return res.json({
            authenticated: true,
            user: {
              id: user.id,
              username: user.username,
            },
          });
        }
      }
      
      res.json({ authenticated: false });
    } catch (error) {
      next(error);
    }
  },
};

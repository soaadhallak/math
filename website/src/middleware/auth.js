/**
 * Middleware to check if user is admin (for API routes)
 */
export const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.set('Cache-Control', 'no-store');
  return res.status(401).json({ error: 'Unauthorized' });
};

/**
 * Middleware to set session expiry based on "remember me"
 */
export const setSessionExpiry = (req, res, next) => {
  if (req.body.rememberMe !== undefined) {
    const rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true';
    
    if (rememberMe) {
      // 30 days for remember me
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
    } else {
      // 2 hours for regular session
      req.session.cookie.maxAge = 1000 * 60 * 60 * 2;
    }
  } else {
    // Default to remember me (checked by default)
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
  }
  
  next();
};

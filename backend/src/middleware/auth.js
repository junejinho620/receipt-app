const { User } = require('../models');

// Simple auth middleware - in production, use JWT or session-based auth
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // In production, verify JWT token here
    // For now, we'll use the token as user ID for simplicity
    // TODO: Implement proper JWT verification

    // Example JWT verification (uncomment when implementing):
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await User.findById(decoded.userId);

    // Temporary: Find user by ID from token
    const user = await User.findById(token);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Optional auth - continues even if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await User.findById(token);

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;

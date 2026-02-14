import { firebaseAdmin } from '../config/firebaseAdmin.js';
import User from '../models/User.js';

const ROLE_WEIGHT = {
  USER: 0,
  VERIFIED: 1,
  MODERATOR: 2,
  ADMIN: 3,
  OWNER: 4
};

const getTokenFromHeader = (authHeader = '') =>
  authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

export const requireFirebase = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      requireFirebase(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (res.headersSent) return;

    const user = await User.findOne({ uid: req.firebaseUser.uid });
    if (!user) return res.status(401).json({ message: 'User not synced' });

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};


export const optionalAuth = async (req, _res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || '');
    if (!token) return next();

    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const user = await User.findOne({ uid: decoded.uid });
    if (user) {
      req.firebaseUser = decoded;
      req.user = user;
    }
    return next();
  } catch (error) {
    return next();
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

export const hasRoleAtLeast = (role, minimumRole) =>
  (ROLE_WEIGHT[role] ?? -1) >= (ROLE_WEIGHT[minimumRole] ?? Number.MAX_SAFE_INTEGER);

export const requireNotBanned = (req, res, next) => {
  const ban = req.user?.ban;
  if (!ban?.isBanned) return next();

  const now = new Date();
  if (ban.until && ban.until <= now) return next();

  return res.status(403).json({
    message: 'Account is banned from uploading',
    until: ban.until,
    reason: ban.reason
  });
};

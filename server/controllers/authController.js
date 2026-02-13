import User from '../models/User.js';

export const syncUser = async (req, res) => {
  const { uid, email, name, picture } = req.firebaseUser;

  if (!email) return res.status(400).json({ message: 'Email missing from token' });

  const username = name || email.split('@')[0];

  const user = await User.findOneAndUpdate(
    { uid },
    {
      uid,
      email,
      username,
      avatar: picture || ''
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ user });
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};

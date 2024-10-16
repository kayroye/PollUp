import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import cookie from 'cookie'; // Import cookie parser

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Parse cookies from the request headers
  const cookies = req.headers.cookie;
  if (!cookies) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const { authToken } = cookie.parse(cookies);

  if (!authToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded.userId !== 'string') {
      throw new Error('Invalid token payload');
    }
    // Proceed with authenticated actions
    res.status(200).json({ message: 'Authenticated', userId: decoded.userId });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token: ' + error });
  }
}

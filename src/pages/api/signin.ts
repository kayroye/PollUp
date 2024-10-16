import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token not provided' });
    }

    try {
      jwt.verify(token, JWT_SECRET as string); // Assert JWT_SECRET is a string
      
      res.setHeader('Set-Cookie', [
        `authToken=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict; Secure`,
      ]);

      res.status(200).json({ message: 'Signed in successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Invalid token' + error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

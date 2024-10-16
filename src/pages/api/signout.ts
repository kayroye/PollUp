import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Clear the authToken cookie
    res.setHeader('Set-Cookie', [
      `authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`,
    ]);

    res.status(200).json({ message: 'Signed out successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

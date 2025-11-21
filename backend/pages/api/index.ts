import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Arsip Kependudukan API Server',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        auth: {
          login: '/api/auth/login',
          logout: '/api/auth/logout',
          me: '/api/auth/me'
        },
        arsip: '/api/arsip'
      },
      features: [
        'File Upload',
        'Authentication',
        'Archive Management'
      ]
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

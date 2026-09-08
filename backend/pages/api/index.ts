import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Document Management API Server',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        auth: {
          login: '/api/auth/login',
          logout: '/api/auth/logout',
          me: '/api/auth/me'
        },
        documents: '/api/documents',
        categories: '/api/categories',
        folders: '/api/folders',
        activity: '/api/activity'
      },
      features: [
        'File Upload',
        'Authentication',
        'Document Management',
        'Document Versions',
        'Document Preview'
      ]
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

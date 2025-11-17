import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    res.status(200).json({
      success: true,
      message: 'OCR Test endpoint is working',
      timestamp: new Date().toISOString(),
      ocrEngines: {
        tesseract: 'Available'
      }
    });
  } catch (error) {
    console.error('Test OCR error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

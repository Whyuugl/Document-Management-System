import { NextApiRequest, NextApiResponse } from 'next';
import { createWorker, PSM, OEM } from 'tesseract.js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { convertPDFToImages, cleanupTempFiles } from '../../../utils/pdfConverter';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Parse the form data
    const form = formidable({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ mimetype }) {
        // Allow image files and PDF files
        return Boolean(mimetype && (mimetype.includes('image') || mimetype.includes('pdf')));
      }
    });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    const fileField =
      (Array.isArray((files as any).file) ? (files as any).file[0] : (files as any).file) ||
      (Array.isArray((files as any).image) ? (files as any).image[0] : (files as any).image);
    const file = fileField as any;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let imagePaths: string[] = [];
    let allExtractedText = '';
    let worker: any = null;

    try {
      console.log('🔄 Starting OCR process...');
      // Create worker with Indonesian and English languages, using LSTM OCR engine
      console.log('⏳ Creating worker...');
      worker = await createWorker(['ind', 'eng'], OEM.LSTM_ONLY);
      console.log('✅ Worker created');
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      console.log('✅ Parameters set');

      // Check if file is PDF - Tesseract.js cannot read PDF directly
      if (file.mimetype && file.mimetype.includes('pdf')) {
        // Convert PDF to images first
        const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        imagePaths = await convertPDFToImages(file.filepath, tempDir);
        
        // Fast mode: process first page only
        if (imagePaths.length > 1) imagePaths = imagePaths.slice(0, 1);
        
        // Process each page
        for (const imagePath of imagePaths) {
          console.log('⏳ Recognizing text from image:', imagePath);
          const { data: { text } } = await worker.recognize(imagePath);
          allExtractedText += text + '\n';
          console.log('✅ Text extracted, length:', text.length);
        }
        
        // Clean up PDF file
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      } else {
        // Process as image file
        console.log('⏳ Recognizing text from image file:', file.filepath);
        const { data: { text } } = await worker.recognize(file.filepath);
        allExtractedText = text;
        console.log('✅ Text extracted, length:', text.length);
        
        // Clean up image file
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      }

      // Return extracted text
      res.status(200).json({
        success: true,
        extractedText: allExtractedText.trim(),
        confidence: 'High',
        language: 'ind+eng',
        fileType: file.mimetype?.includes('pdf') ? 'PDF' : 'Image',
        timestamp: new Date().toISOString()
      });

    } catch (ocrError) {
      console.error('OCR Processing Error:', ocrError);
      // Only send error if response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to process image with OCR',
          details: ocrError instanceof Error ? ocrError.message : 'Unknown error'
        });
      }
    } finally {
      // Always terminate worker to prevent hanging
      if (worker) {
        try {
          await worker.terminate();
          console.log('✅ Worker terminated successfully');
        } catch (terminateError) {
          console.error('Error terminating worker:', terminateError);
        }
      }

      // Clean up temporary image files if any
      if (imagePaths.length > 0) {
        try {
          cleanupTempFiles(imagePaths);
          // Also clean up the temp directory
          const tempDir = path.dirname(imagePaths[0]);
          if (fs.existsSync(tempDir)) {
            fs.rmdirSync(tempDir, { recursive: true });
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temp files:', cleanupError);
        }
      }
    }

  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image with OCR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

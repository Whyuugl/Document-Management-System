import pdf2pic from 'pdf2pic';
import path from 'path';
import fs from 'fs';

export const convertPDFToImages = async (pdfPath: string, outputDir: string): Promise<string[]> => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const convert = pdf2pic.fromPath(pdfPath, {
      density: 300,           // Higher density for better OCR
      saveFilename: "page",
      savePath: outputDir,
      format: "png",
      width: 2000,
      height: 2000
    });

    // Convert all pages
    const results = await convert.bulk(-1, { responseType: "image" });
    
    // Return array of image paths
    return results.map((result: any) => result.path);
  } catch (error) {
    console.error('PDF conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for common errors
    if (errorMessage.includes('gm') || errorMessage.includes('GraphicsMagick') || errorMessage.includes('ImageMagick')) {
      throw new Error('GraphicsMagick or ImageMagick not found. Please install GraphicsMagick or ImageMagick for PDF conversion.');
    }
    
    throw new Error(`Failed to convert PDF to images: ${errorMessage}`);
  }
};

export const cleanupTempFiles = (filePaths: string[]) => {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', filePath, error);
    }
  });
};

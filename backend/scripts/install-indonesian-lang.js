const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing Indonesian Language Pack for Tesseract...');

// Check if Tesseract is available
function checkTesseract() {
  try {
    const result = execSync('tesseract --version', { encoding: 'utf8' });
    console.log('✅ Tesseract found:', result.split('\n')[0]);
    return true;
  } catch (error) {
    console.log('❌ Tesseract not found. Please install Tesseract first.');
    return false;
  }
}

// Get available languages
function getAvailableLanguages() {
  try {
    const result = execSync('tesseract --list-langs', { encoding: 'utf8' });
    const lines = result.split('\n').filter(line => line.trim());
    const languages = lines.slice(1); // Skip the first line
    return languages.map(lang => lang.trim()).filter(lang => lang);
  } catch (error) {
    console.log('❌ Failed to get available languages:', error.message);
    return [];
  }
}

// Download Indonesian language pack
async function downloadIndonesianLanguagePack() {
  const downloadUrl = 'https://github.com/tesseract-ocr/tessdata/raw/main/ind.traineddata';
  const outputFile = 'ind.traineddata';
  
  console.log('📥 Downloading Indonesian language pack...');
  
  try {
    const https = require('https');
    const fs = require('fs');
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outputFile);
      https.get(downloadUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('✅ Download completed');
          resolve(outputFile);
        });
      }).on('error', (err) => {
        fs.unlink(outputFile, () => {}); // Delete the file on error
        reject(err);
      });
    });
  } catch (error) {
    console.log('❌ Download failed:', error.message);
    return null;
  }
}

// Install language pack
function installLanguagePack(filePath) {
  try {
    // Find Tesseract installation directory
    const tesseractPath = 'C:\\Program Files\\Tesseract-OCR\\tessdata';
    
    if (!fs.existsSync(tesseractPath)) {
      console.log('❌ Tesseract tessdata directory not found');
      return false;
    }
    
    const targetPath = path.join(tesseractPath, 'ind.traineddata');
    
    console.log('📁 Installing language pack...');
    console.log(`   From: ${filePath}`);
    console.log(`   To: ${targetPath}`);
    
    // Try to copy the file
    try {
      fs.copyFileSync(filePath, targetPath);
      console.log('✅ Language pack installed successfully!');
      return true;
    } catch (error) {
      console.log('❌ Failed to install language pack:', error.message);
      console.log('');
      console.log('📋 Manual installation required:');
      console.log(`1. Copy ${filePath} to ${targetPath}`);
      console.log('2. Run as Administrator if needed');
      console.log('3. Restart your terminal/command prompt');
      return false;
    }
  } catch (error) {
    console.log('❌ Installation failed:', error.message);
    return false;
  }
}

// Main installation process
async function main() {
  console.log('🚀 Starting Indonesian Language Pack installation...\n');

  // Check Tesseract
  if (!checkTesseract()) {
    return;
  }

  // Check current languages
  console.log('\n📋 Current available languages:');
  const currentLanguages = getAvailableLanguages();
  if (currentLanguages.length > 0) {
    currentLanguages.forEach(lang => {
      console.log(`   - ${lang}`);
    });
  } else {
    console.log('   No languages found');
  }

  // Check if Indonesian is already installed
  if (currentLanguages.includes('ind')) {
    console.log('\n✅ Indonesian language pack is already installed!');
    return;
  }

  console.log('\n❌ Indonesian language pack not found. Installing...');

  // Download language pack
  const downloadedFile = await downloadIndonesianLanguagePack();
  
  if (downloadedFile && fs.existsSync(downloadedFile)) {
    // Install language pack
    const installed = installLanguagePack(downloadedFile);
    
    if (installed) {
      // Clean up downloaded file
      try {
        fs.unlinkSync(downloadedFile);
      } catch (error) {
        console.log('⚠️  Could not clean up downloaded file');
      }
      
      // Verify installation
      console.log('\n🧪 Verifying installation...');
      const newLanguages = getAvailableLanguages();
      if (newLanguages.includes('ind')) {
        console.log('✅ Indonesian language pack successfully installed!');
        console.log('\n🎉 You can now use Indonesian OCR with:');
        console.log('   - Language code: ind');
        console.log('   - Combined with English: ind+eng');
      } else {
        console.log('❌ Installation verification failed');
      }
    }
  } else {
    console.log('❌ Could not download language pack');
    console.log('\n📋 Manual installation:');
    console.log('1. Download from: https://github.com/tesseract-ocr/tessdata/raw/main/ind.traineddata');
    console.log('2. Save as: ind.traineddata');
    console.log('3. Copy to: C:\\Program Files\\Tesseract-OCR\\tessdata\\');
    console.log('4. Run as Administrator if needed');
  }
}

main().catch(console.error);

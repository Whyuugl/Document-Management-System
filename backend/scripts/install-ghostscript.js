const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing Ghostscript...');

// Check if Ghostscript is already installed
function checkGhostscript() {
  try {
    const gsVersion = execSync('gswin64c --version', { encoding: 'utf8' });
    console.log('✅ Ghostscript found:', gsVersion.split('\n')[0]);
    return true;
  } catch (error) {
    try {
      const gsVersion32 = execSync('gswin32c --version', { encoding: 'utf8' });
      console.log('✅ Ghostscript found:', gsVersion32.split('\n')[0]);
      return true;
    } catch (error2) {
      return false;
    }
  }
}

// Download Ghostscript installer
async function downloadGhostscript() {
  const downloadUrl = 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1003/gs1003w64.exe';
  const installerPath = path.join(process.cwd(), 'ghostscript-installer.exe');
  
  console.log('📥 Downloading Ghostscript installer...');
  
  try {
    const https = require('https');
    const fs = require('fs');
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(installerPath);
      https.get(downloadUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('✅ Download completed');
          resolve(installerPath);
        });
      }).on('error', (err) => {
        fs.unlink(installerPath, () => {}); // Delete the file on error
        reject(err);
      });
    });
  } catch (error) {
    console.log('❌ Download failed:', error.message);
    return null;
  }
}

// Install Ghostscript
function installGhostscript(installerPath) {
  console.log('🔧 Installing Ghostscript...');
  console.log('⚠️  Please run the installer manually:');
  console.log(`   ${installerPath}`);
  console.log('');
  console.log('📋 Installation steps:');
  console.log('1. Run the installer as Administrator');
  console.log('2. Follow the installation wizard');
  console.log('3. Make sure to add Ghostscript to PATH');
  console.log('4. Restart your terminal/command prompt');
  console.log('');
  console.log('🔗 Alternative: Download from official website:');
  console.log('   https://www.ghostscript.com/download/gsdnld.html');
}

// Main installation process
async function main() {
  console.log('🚀 Starting Ghostscript installation process...\n');

  // Check if already installed
  if (checkGhostscript()) {
    console.log('✅ Ghostscript is already installed!');
    return;
  }

  console.log('❌ Ghostscript not found. Installing...\n');

  // Try to download installer
  const installerPath = await downloadGhostscript();
  
  if (installerPath && fs.existsSync(installerPath)) {
    installGhostscript(installerPath);
  } else {
    console.log('❌ Could not download installer automatically.');
    console.log('');
    console.log('📋 Manual installation required:');
    console.log('1. Download Ghostscript from: https://www.ghostscript.com/download/gsdnld.html');
    console.log('2. Run the installer as Administrator');
    console.log('3. Add Ghostscript to your system PATH');
    console.log('4. Restart your terminal/command prompt');
    console.log('');
    console.log('🔧 Or try chocolatey (run as Administrator):');
    console.log('   choco install ghostscript');
  }
}

main().catch(console.error);


import React, { useState } from 'react';

const KTPOCRScanner = ({ onDataExtracted, onClose }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type (images and PDF)
      if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
        setError('Silakan pilih file gambar atau PDF');
        return;
      }
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('Ukuran file harus kurang dari 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setExtractedData(null);
    }
  };

  const parseKTPData = (text) => {
    // Parse KTP text to extract structured data
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let parsedData = {
      namaLengkap: '',
      jenisKelamin: '',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      nomorAkta: ''
    };

    // Extract NIK (Nomor Induk Kependudukan)
    const nikMatch = text.match(/\b\d{16}\b/);
    if (nikMatch) {
      parsedData.nomorAkta = nikMatch[0];
    }

    // Extract name (usually after "Nama" or "NAMA")
    const nameMatch = text.match(/(?:Nama|NAMA)\s*:?\s*([A-Z\s]+)/i);
    if (nameMatch) {
      parsedData.namaLengkap = nameMatch[1].trim();
    }

    // Extract gender
    const genderMatch = text.match(/(?:Jenis Kelamin|JENIS KELAMIN)\s*:?\s*(LAKI-LAKI|PEREMPUAN|Laki-laki|Perempuan)/i);
    if (genderMatch) {
      const gender = genderMatch[1].toLowerCase();
      parsedData.jenisKelamin = gender.includes('laki') ? 'laki-laki' : 'perempuan';
    }

    // Extract birth place
    const birthPlaceMatch = text.match(/(?:Tempat\/Tgl Lahir|TEMPAT\/TGL LAHIR)\s*:?\s*([A-Z\s]+),\s*\d{2}-\d{2}-\d{4}/i);
    if (birthPlaceMatch) {
      parsedData.tempatLahir = birthPlaceMatch[1].trim();
    }

    // Extract birth date
    const birthDateMatch = text.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (birthDateMatch) {
      const [, day, month, year] = birthDateMatch;
      parsedData.tanggalLahir = `${year}-${month}-${day}`;
    }

    // Extract address (usually after "Alamat" or "ALAMAT")
    const addressMatch = text.match(/(?:Alamat|ALAMAT)\s*:?\s*([A-Z0-9\s,.-]+?)(?:\n|RT\/RW|Kel\/Desa)/i);
    if (addressMatch) {
      parsedData.alamat = addressMatch[1].trim();
    }

    return parsedData;
  };

  const handleScanKTP = async () => {
    if (!file) {
      setError('Silakan pilih file gambar terlebih dahulu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use Tesseract.js endpoint
      const endpoint = '/api/ocr/parse-ktp';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Use data from API response - handle both old and new response formats
        const data = result.data || result;
        setExtractedData(data);
        
        // Show extracted data to user for confirmation
        if (onDataExtracted) {
          onDataExtracted(data);
        }
      } else {
        // Check for Ghostscript error specifically
        if (result.error && result.error.includes('Ghostscript')) {
          setError(
            <div>
              <p className="font-semibold text-red-800 mb-2">Ghostscript Diperlukan</p>
              <p className="text-red-700 mb-2">{result.error}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                <p className="text-sm text-yellow-800">
                  <strong>Solusi Cepat:</strong> Download Ghostscript dari{' '}
                  <a 
                    href="https://www.ghostscript.com/download/gsdnld.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    ghostscript.com
                  </a>
                  {' '}dan install, lalu restart aplikasi.
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Atau gunakan Tesseract.js (lebih cepat) untuk OCR dasar tanpa fitur PDF.
                </p>
              </div>
            </div>
          );
        } else {
          setError(result.error || 'Gagal memproses gambar');
        }
      }
    } catch (err) {
      setError('Error jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      onClose();
    }
  };

  const handleClear = () => {
    setFile(null);
    setExtractedData(null);
    setError('');
    const fileInput = document.getElementById('ktp-file-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Scan KTP/KK</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Gambar/PDF KTP/KK
            </label>
            <input
              id="ktp-file-input"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Dipilih: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={handleScanKTP}
              disabled={!file || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                'Scan KTP/KK'
              )}
            </button>
            
            <button
              onClick={handleClear}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          </div>

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Data yang Ditemukan:</h3>
              <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                {extractedData.namaLengkap && (
                  <div>
                    <span className="font-medium">Nama:</span> {extractedData.namaLengkap}
                  </div>
                )}
                {extractedData.jenisKelamin && (
                  <div>
                    <span className="font-medium">Jenis Kelamin:</span> {extractedData.jenisKelamin}
                  </div>
                )}
                {extractedData.tempatLahir && (
                  <div>
                    <span className="font-medium">Tempat Lahir:</span> {extractedData.tempatLahir}
                  </div>
                )}
                {extractedData.tanggalLahir && (
                  <div>
                    <span className="font-medium">Tanggal Lahir:</span> {extractedData.tanggalLahir}
                  </div>
                )}
                {extractedData.alamat && (
                  <div>
                    <span className="font-medium">Alamat:</span> {extractedData.alamat}
                  </div>
                )}
                {extractedData.nomorAkta && (
                  <div>
                    <span className="font-medium">NIK:</span> {extractedData.nomorAkta}
                  </div>
                )}
              </div>
              
              {/* Use Data Button */}
              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleUseData}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Gunakan Data Ini
                </button>
                <button
                  onClick={handleClear}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Scan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Petunjuk:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload gambar atau PDF KTP/KK yang jelas dan tidak blur</li>
              <li>• Pastikan teks dalam file mudah dibaca</li>
              <li>• Maksimal ukuran file: 10MB</li>
              <li>• Format yang didukung: JPG, PNG, GIF, PDF</li>
              <li>• Data akan otomatis diisi ke form setelah scan</li>
              <li>• Menggunakan Tesseract.js untuk OCR</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KTPOCRScanner;

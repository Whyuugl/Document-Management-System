import React, { useState } from 'react';

const TambahArsip = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [modalMessage, setModalMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({
    kelahiran: null,
    pernikahan: null,
    perceraian: null,
    kematian: null
  });
  const [activeArsipTypes, setActiveArsipTypes] = useState([]); // Array untuk menyimpan jenis akta yang aktif (sudah diklik)
  const [formData, setFormData] = useState({
    noKK: '',
    nik: '',
    namaLengkap: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    alamat: ''
  });

  // Icons
  const icons = {
    birth: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 16 16">
        <path fill="currentColor" d="M15 3v10H1V3zm1-1H0v12h16z"/>
        <path fill="currentColor" d="M8 5h6v1H8zm0 2h6v1H8zm0 2h3v1H8zM5.4 7H5v-.1c.6-.2 1-.8 1-1.4C6 4.7 5.3 4 4.5 4S3 4.7 3 5.5c0 .7.4 1.2 1 1.4V7h-.4C2.7 7 2 7.7 2 8.6V11h5V8.6C7 7.7 6.3 7 5.4 7"/>
      </svg>
    ),
    marriage: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 22q-1.65 0-3.075-.637t-2.525-1.713Q5.325 18.575 4.688 17.15T4.05 14.075q0-1.425.488-2.713T6 9.05q.4-.4.9-.663t1.1-.337q.6-.075 1.2.025t1.15.375q.55.35.95.95q.4-.6.95-.95t1.15-.375q.6-.1 1.2-.025t1.1.337q.5.263.9.663q1 1 1.488 2.288t.487 2.712q0 1.475-.637 2.9t-1.763 2.5q-1.075 1.075-2.5 1.713T12 22"/>
      </svg>
    ),
    divorce: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 2048 2048">
        <path fill="currentColor" d="M1040 946q119 46 217 128t164 191l-93 93q-42-77-102-138t-132-105t-155-67t-171-24q-88 0-170 23t-153 64t-129 100t-100 130t-65 153t-23 170H0q0-120 35-231t101-205t156-167t204-115q-113-74-176-186t-64-248q0-106 40-199t109-163T568 40T768 0t199 40t163 109t110 163t40 200q0 66-16 129t-48 119t-75 103t-101 83M384 512q0 80 30 149t82 122t122 83t150 30q79 0 149-30t122-82t83-122t30-150q0-79-30-149t-82-122t-123-83t-149-30q-80 0-149 30t-122 82t-83 123t-30 149m1661 990l-226 226l226 227l-90 90l-227-226l-227 227l-90-91l227-227l-227-227l90-90l227 227l227-227z"/>
      </svg>
    ),
    death: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 16 16">
        <path fill="currentColor" d="M15 3v10H1V3zm1-1H0v12h16z"/>
        <path fill="currentColor" d="M8 5h6v1H8zm0 2h6v1H8zm0 2h3v1H8zM5.4 7H5v-.1c.6-.2 1-.8 1-1.4C6 4.7 5.3 4 4.5 4S3 4.7 3 5.5c0 .7.4 1.2 1 1.4V7h-.4C2.7 7 2 7.7 2 8.6V11h5V8.6C7 7.7 6.3 7 5.4 7"/>
      </svg>
    )
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (jenisArsip, e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Format file tidak didukung! Gunakan PDF, JPG, PNG, DOC, atau DOCX');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 10MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFiles(prev => ({
        ...prev,
        [jenisArsip]: file
      }));
    }
  };

  const handleRemoveFile = (jenisArsip) => {
    setSelectedFiles(prev => ({
      ...prev,
      [jenisArsip]: null
    }));
    // Reset file input
    const fileInput = document.getElementById(`file-upload-${jenisArsip}`);
    if (fileInput) fileInput.value = '';
  };

  const handleArsipTypeToggle = (jenisArsip) => {
    if (activeArsipTypes.includes(jenisArsip)) {
      // Jika sudah aktif, tutup (hapus dari array)
      setActiveArsipTypes(prev => prev.filter(type => type !== jenisArsip));
      // Hapus file jika ada
      handleRemoveFile(jenisArsip);
    } else {
      // Jika belum aktif, buka (tambah ke array)
      setActiveArsipTypes(prev => [...prev, jenisArsip]);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if at least one file is uploaded
    const hasFile = Object.values(selectedFiles).some(file => file !== null);
    if (!hasFile) {
      alert('Upload minimal 1 file akta terlebih dahulu!');
      return;
    }

    setLoading(true);
    setShowModal(true);
    setModalStatus('loading');
    setModalMessage('Menyimpan arsip...');

    try {
      // Submit each file separately
      const uploadPromises = [];
      const uploadedTypes = [];

      for (const [jenisArsip, file] of Object.entries(selectedFiles)) {
        if (file) {
          const formDataToSend = new FormData();
          formDataToSend.append('jenis_arsip', jenisArsip);
          formDataToSend.append('no_kk', formData.noKK);
          formDataToSend.append('nik', formData.nik);
          formDataToSend.append('nama_lengkap', formData.namaLengkap);
          formDataToSend.append('tempat_lahir', formData.tempatLahir);
          formDataToSend.append('tanggal_lahir', formData.tanggalLahir);
          formDataToSend.append('jenis_kelamin', formData.jenisKelamin);
          formDataToSend.append('alamat', formData.alamat);
          formDataToSend.append('file', file);

          const promise = fetch('/api/arsip', {
            method: 'POST',
            body: formDataToSend,
            credentials: 'include'
          }).then(async response => {
            const data = await response.json();
            if (!response.ok) {
              return { success: false, error: data.error || 'Gagal menyimpan arsip' };
            }
            return data;
          }).catch(error => {
            return { success: false, error: error.message || 'Terjadi kesalahan saat mengirim data' };
          });

          uploadPromises.push(promise);
          uploadedTypes.push(jenisArsip);
        }
      }

      // Wait for all uploads to complete (use allSettled to handle partial failures)
      const results = await Promise.all(uploadPromises);
      
      // Check if all uploads succeeded
      const allSuccess = results.every(result => result.success);
      const failedTypes = results
        .map((result, index) => !result.success ? uploadedTypes[index] : null)
        .filter(Boolean);

      if (allSuccess) {
        const successCount = results.length;
        setLoading(false);
        setModalStatus('success');
        setModalMessage(`Berhasil menambahkan ${successCount} arsip!`);
        
        // Reset form setelah 2 detik (setelah animasi success)
        setTimeout(() => {
          setFormData({
            noKK: '',
            nik: '',
            namaLengkap: '',
            tempatLahir: '',
            tanggalLahir: '',
            jenisKelamin: '',
            alamat: ''
          });
          setSelectedFiles({
            kelahiran: null,
            pernikahan: null,
            perceraian: null,
            kematian: null
          });
          setActiveArsipTypes([]);
          
          // Reset all file inputs
          ['kelahiran', 'pernikahan', 'perceraian', 'kematian'].forEach(jenis => {
            const fileInput = document.getElementById(`file-upload-${jenis}`);
            if (fileInput) fileInput.value = '';
          });
          
          // Tutup modal setelah reset
          setTimeout(() => {
            setShowModal(false);
            setModalStatus('loading');
          }, 500);
        }, 2000);
      } else {
        const errorMessages = results
          .map((result, index) => !result.success ? `${uploadedTypes[index]}: ${result.error || 'Unknown error'}` : null)
          .filter(Boolean);
        setModalStatus('error');
        setModalMessage(`Gagal menambahkan arsip:\n${errorMessages.join('\n')}`);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setModalStatus('error');
      setModalMessage(`Terjadi kesalahan saat mengirim data: ${error.message || 'Unknown error'}`);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getArsipTypeLabel = (type) => {
    const labels = {
      'kelahiran': 'Akta Kelahiran',
      'pernikahan': 'Akta Pernikahan',
      'perceraian': 'Akta Perceraian',
      'kematian': 'Akta Kematian'
    };
    return labels[type] || type;
  };

  const arsipTypes = [
    { key: 'kelahiran', label: 'Akta Kelahiran', icon: icons.birth },
    { key: 'pernikahan', label: 'Akta Pernikahan', icon: icons.marriage },
    { key: 'perceraian', label: 'Akta Perceraian', icon: icons.divorce },
    { key: 'kematian', label: 'Akta Kematian', icon: icons.death }
  ];

  return (
    <div className="space-y-8">
      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-white bg-opacity-10">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-200">
            <div className="flex flex-col items-center justify-center">
              {/* Loading Spinner */}
              {modalStatus === 'loading' && (
                <>
                  <div className="relative w-20 h-20 mb-4">
                    <svg className="animate-spin h-20 w-20 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">{modalMessage}</p>
                </>
              )}

              {/* Success Checkmark */}
              {modalStatus === 'success' && (
                <>
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-600 mb-2">Tersimpan</p>
                  <p className="text-sm text-gray-600 text-center">{modalMessage}</p>
                </>
              )}

              {/* Error Icon */}
              {modalStatus === 'error' && (
                <>
                  <div className="relative w-20 h-20 mb-4">
                    <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-red-600 mb-2">Gagal</p>
                  <p className="text-sm text-gray-600 text-center whitespace-pre-line">{modalMessage}</p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setModalStatus('loading');
                    }}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginLeft: '65px' }}>
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Arsip Kependudukan | Tambah Arsip</h1>
          <p className="text-blue-100 mt-2">Isi data kependudukan untuk menambahkan arsip baru</p>
        </div>

        {/* Form Data Kependudukan */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
            Data Kependudukan
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* No KK */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. Kartu Keluarga (KK) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="noKK"
                  value={formData.noKK}
                  onChange={handleInputChange}
                  placeholder="Masukkan No. KK" 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                />
              </div>

              {/* NIK */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  placeholder="Masukkan NIK" 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleInputChange}
                  placeholder="Masukkan Nama Lengkap" 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                />
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  placeholder="Masukkan Tempat Lahir" 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select 
                  name="jenisKelamin"
                  value={formData.jenisKelamin}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                  required
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            {/* Alamat - Full Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                placeholder="Masukkan Alamat Lengkap"
                rows="3"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                required
              />
            </div>

            {/* Jenis Arsip Section - Button untuk memilih jenis akta */}
            <div className="pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Pilih Jenis Akta (Klik untuk upload file) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {arsipTypes.map((arsipType) => (
                  <button
                    key={arsipType.key}
                    type="button"
                    onClick={() => handleArsipTypeToggle(arsipType.key)}
                    className={`flex flex-col items-center justify-center gap-3 px-6 py-5 border-2 rounded-xl transition-all transform hover:scale-105 ${
                      activeArsipTypes.includes(arsipType.key)
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-3 rounded-full ${
                      activeArsipTypes.includes(arsipType.key) ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {arsipType.icon}
                    </div>
                    <span className={`font-semibold ${
                      activeArsipTypes.includes(arsipType.key) ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {arsipType.label}
                    </span>
                    {selectedFiles[arsipType.key] && (
                      <span className="text-xs text-green-600 font-medium">✓ File dipilih</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload File Section - Muncul ketika jenis akta diklik */}
            {activeArsipTypes.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Upload File Akta
                </label>
                <div className="space-y-6">
                  {activeArsipTypes.map((jenisArsip) => {
                    const arsipType = arsipTypes.find(type => type.key === jenisArsip);
                    return (
                      <div key={jenisArsip} className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              {arsipType.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">{arsipType.label}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleArsipTypeToggle(jenisArsip)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Tutup"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center">
                          <input
                            id={`file-upload-${jenisArsip}`}
                            type="file"
                            onChange={(e) => handleFileChange(jenisArsip, e)}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="hidden"
                          />
                          
                          {!selectedFiles[jenisArsip] ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mb-3">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                              </svg>
                              <p className="text-sm text-gray-600 mb-2">
                                Klik untuk memilih file atau drag & drop file di sini
                              </p>
                              <p className="text-xs text-gray-500 mb-4">
                                Format: PDF, JPG, PNG, DOC, DOCX (Maks. 10MB)
                              </p>
                              <label
                                htmlFor={`file-upload-${jenisArsip}`}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition font-medium"
                              >
                                Pilih File
                              </label>
                            </>
                          ) : (
                            <div className="w-full max-w-md">
                              <div className="bg-white border border-green-300 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{selectedFiles[jenisArsip].name}</p>
                                    <p className="text-xs text-gray-500">{(selectedFiles[jenisArsip].size / 1024 / 1024).toFixed(2)} MB</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor={`file-upload-${jenisArsip}`}
                                    className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm"
                                    title="Ganti File"
                                  >
                                    Ganti
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(jenisArsip)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Hapus File"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => {
                  setFormData({
                    noKK: '',
                    nik: '',
                    namaLengkap: '',
                    tempatLahir: '',
                    tanggalLahir: '',
                    jenisKelamin: '',
                    alamat: ''
                  });
                  setSelectedFiles({
                    kelahiran: null,
                    pernikahan: null,
                    perceraian: null,
                    kematian: null
                  });
                  setActiveArsipTypes([]);
                  // Reset all file inputs
                  ['kelahiran', 'pernikahan', 'perceraian', 'kematian'].forEach(jenis => {
                    const fileInput = document.getElementById(`file-upload-${jenis}`);
                    if (fileInput) fileInput.value = '';
                  });
                }}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Reset
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Arsip'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TambahArsip;
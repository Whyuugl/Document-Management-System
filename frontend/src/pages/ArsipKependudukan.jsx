import React, { useState, useEffect } from 'react';

const ArsipKependudukan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJenisArsip, setSelectedJenisArsip] = useState('semua');
  const [archiveData, setArchiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchArsipData();
  }, [currentPage, showEntries, selectedJenisArsip]);

  const fetchArsipData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: showEntries.toString()
      });
      
      if (selectedJenisArsip !== 'semua') {
        params.append('jenis_arsip', selectedJenisArsip);
      }

      const response = await fetch(`/api/arsip?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Group by nama_lengkap to show all akta types per person
          const groupedData = groupByPerson(data.data);
          setArchiveData(groupedData);
          setTotalRecords(data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching arsip data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group arsip by nama_lengkap to show all akta types per person
  const groupByPerson = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const key = item.nama_lengkap;
      if (!grouped[key]) {
        grouped[key] = {
          id: item.id,
          nama: item.nama_lengkap,
          nik: item.nik,
          noKK: item.no_kk,
          jenisKelamin: item.jenis_kelamin,
          aksi: [],
          statusBadge: 'Tersimpan' // All saved arsip are "Tersimpan"
        };
      }
      // Add jenis_arsip to aksi array if not already present
      const jenisLabel = getJenisArsipLabel(item.jenis_arsip);
      if (!grouped[key].aksi.includes(jenisLabel)) {
        grouped[key].aksi.push(jenisLabel);
      }
    });

    return Object.values(grouped);
  };

  const getJenisArsipLabel = (jenis) => {
    const labels = {
      'kelahiran': 'Akta Kelahiran',
      'pernikahan': 'Akta Pernikahan',
      'perceraian': 'Akta Perceraian',
      'kematian': 'Akta Kematian'
    };
    return labels[jenis] || jenis;
  };


  // Filter data by search term (client-side filtering for search)
  const filteredData = archiveData.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter berdasarkan jenis arsip - cek apakah ada di array aksi
    const matchesJenis = selectedJenisArsip === 'semua' || 
      item.aksi.some(akta => {
        const aktaMap = {
          'Akta Kelahiran': 'kelahiran',
          'Akta Pernikahan': 'pernikahan',
          'Akta Perceraian': 'perceraian',
          'Akta Kematian': 'kematian'
        };
        return aktaMap[akta] === selectedJenisArsip;
      });
    return matchesSearch && matchesJenis;
  });

  const totalPages = Math.ceil(filteredData.length / showEntries);
  const startIndex = (currentPage - 1) * showEntries;
  const endIndex = startIndex + showEntries;
  const currentData = filteredData.slice(startIndex, endIndex);


  const handleViewDetail = (id) => {
    alert(`Lihat detail arsip dengan ID: ${id}`);
  };

  const handleEdit = (id) => {
    alert(`Edit arsip dengan ID: ${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini?')) {
      alert(`Arsip dengan ID: ${id} berhasil dihapus`);
    }
  };

  return (
    <div className="space-y-8">
      <div style={{ marginLeft: '45px' }}>
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">E-ARSIP DUKCAPIL | Arsip Kependudukan</h1>
          <p className="text-blue-100 mt-2">Kelola dan lihat arsip kependudukan</p>
        </div>

        {/* Filter Jenis Arsip */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedJenisArsip('semua');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedJenisArsip === 'semua'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setSelectedJenisArsip('kelahiran');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedJenisArsip === 'kelahiran'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Akta Kelahiran
            </button>
            <button
              onClick={() => {
                setSelectedJenisArsip('pernikahan');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedJenisArsip === 'pernikahan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Akta Pernikahan
            </button>
            <button
              onClick={() => {
                setSelectedJenisArsip('perceraian');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedJenisArsip === 'perceraian'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Akta Perceraian
            </button>
            <button
              onClick={() => {
                setSelectedJenisArsip('kematian');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedJenisArsip === 'kematian'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Akta Kematian
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show</label>
                <select
                  value={showEntries}
                  onChange={(e) => setShowEntries(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Tidak ada data arsip
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr key={`${item.nama}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          {item.aksi.map((akta, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {akta}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.jenisKelamin}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        item.statusBadge === 'Tersimpan' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.statusBadge}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredData.length > 0 ? startIndex + 1 : 0}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{' '}
                  <span className="font-medium">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArsipKependudukan;

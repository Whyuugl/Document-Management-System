import React from 'react';
import logoBwi from '../assets/img/logo_bwi 1.svg';

const Sidebar = ({ onPageChange, currentPage }) => {
  return (
    <div className="w-[263px] bg-white h-screen flex-shrink-0 border-r border-gray-200 font-poppins flex flex-col" style={{ boxShadow: '8px 8px 20px 0px #00000040' }}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center">
          <img src={logoBwi} alt="Logo BWI" className="w-10 h-10 mr-3" />
          <div className="w-[2px] h-10 bg-black mr-3"></div>
          <h1 className="text-xl font-bold text-black-600 leading-tight">E-ARSIP<br />DUKCAPIL</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {/* Dashboard Link */}
        <div className="py-3">
          <button
            onClick={() => onPageChange('dashboard')}
            className={`flex items-center w-[263px] h-[58px] px-[36px] text-[20px] font-normal transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-[#5D71E25E] bg-opacity-37 text-[#3C0BA8]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-[3px]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                <path d="m9 22l.002-4.002c0-.931 0-1.396.153-1.763a2 2 0 0 1 1.083-1.083C10.605 15 11.07 15 12 15v0c.93 0 1.396 0 1.764.152a2 2 0 0 1 1.083 1.083C15 16.603 15 17.068 15 18v4"/>
                <path d="m7.088 4.762l-1 .781c-1.516 1.184-2.275 1.776-2.681 2.61C3 8.988 3 9.952 3 11.88v2.092c0 3.784 0 5.676 1.172 6.852S7.229 22 11 22h2c3.771 0 5.657 0 6.828-1.176S21 17.756 21 13.971v-2.09c0-1.929 0-2.893-.407-3.728c-.407-.834-1.165-1.426-2.681-2.61l-1-.78C14.552 2.92 13.372 2 12 2s-2.552.92-4.912 2.762"/>
              </g>
            </svg>
            Dashboard
          </button>
        </div>

        <div className="w-[209px] h-[1px] bg-black mx-auto mt-[2px] opacity-20 mb-[4px]"></div>

        {/* Main Menu */}
        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-normal text-[20px]">MAIN MENU</h3>
        </div>
        
        {/* Menu Items */}
        <div className="px-6">
          <button
            onClick={() => onPageChange('arsip')}
            className={`flex items-center w-full px-3 py-2 text-[16px] rounded-md mb-1 transition-colors ${
              currentPage === 'arsip'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M.54 3.87L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139q.323-.119.684-.12h5.396z"/>
            </svg>
            Arsip Kependudukan
          </button>
          
          <button
            onClick={() => onPageChange('tambah')}
            className={`flex items-center w-full px-3 py-2 text-[16px] rounded-md mb-1 transition-colors ${
              currentPage === 'tambah'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 18h-1v-1a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2m-7 2H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5v3a3 3 0 0 0 3 3h3v3a1 1 0 0 0 2 0V8.94a1.3 1.3 0 0 0-.06-.27v-.09a1 1 0 0 0-.19-.28l-6-6a1 1 0 0 0-.28-.19a.3.3 0 0 0-.1 0a1.1 1.1 0 0 0-.31-.11H6a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h7a1 1 0 0 0 0-2m0-14.59L15.59 8H14a1 1 0 0 1-1-1ZM8 8a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2Zm5 8H8a1 1 0 0 0 0 2h5a1 1 0 0 0 0-2m1-4H8a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2"/>
            </svg>
            Tambah Arsip
          </button>
          
          <button
            onClick={() => onPageChange('laporan')}
            className={`flex items-center w-full px-3 py-2 text-[16px] rounded-md mb-1 transition-colors ${
              currentPage === 'laporan'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <g fill="currentColor">
                <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1"/>
              </g>
            </svg>
            Laporan Arsip
          </button>
          
          <button
            onClick={() => onPageChange('pengaturan')}
            className={`flex items-center w-full px-3 py-2 text-[16px] rounded-md mb-1 transition-colors ${
              currentPage === 'pengaturan'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" fillRule="evenodd" d="M8 5C6.34 5 5 6.34 5 8s1.34 3 3 3s3-1.34 3-3s-1.34-3-3-3M6 8a2 2 0 1 1 4.001-.001A2 2 0 0 1 6 8" clipRule="evenodd"/>
              <path fill="currentColor" fillRule="evenodd" d="M8 0C6.9 0 6 .895 6 2v.068a.46.46 0 0 1-.285.423a.45.45 0 0 1-.492-.096a1.924 1.924 0 0 0-2.72 0l-.109.11a1.924 1.924 0 0 0 0 2.72a.45.45 0 0 1 .096.491a.46.46 0 0 1-.424.285h-.068a2 2 0 1 0 0 4h.068c.183 0 .352.112.424.285a.45.45 0 0 1-.096.492a1.924 1.924 0 0 0 0 2.72l.109.11c.751.75 1.97.75 2.72 0a.45.45 0 0 1 .492-.097c.172.072.285.24.285.424v.068a2 2 0 1 0 4 0v-.068c0-.183.112-.352.285-.424a.45.45 0 0 1 .492.096c.751.751 1.97.751 2.72 0l.109-.109a1.924 1.924 0 0 0 0-2.72a.45.45 0 0 1-.096-.492a.46.46 0 0 1 .424-.285H14a2 2 0 1 0 0-4h-.067a.46.46 0 0 1-.424-.285a.45.45 0 0 1 .096-.492a1.924 1.924 0 0 0 0-2.72l-.109-.109a1.924 1.924 0 0 0-2.72 0a.45.45 0 0 1-.492.096a.46.46 0 0 1-.285-.424V2c0-1.1-.895-2-2-2M7 2a1 1 0 0 1 2 0v.068c0 .59.359 1.12.902 1.35c.54.223 1.17.102 1.58-.314a.917.917 0 0 1 1.3 0l.109.11a.93.93 0 0 1 0 1.31a1.45 1.45 0 0 0-.313 1.58c.225.543.756.902 1.35.902h.067a1 1 0 0 1 0 2h-.067a1.47 1.47 0 0 0-1.35.902c-.224.54-.103 1.17.313 1.58c.36.36.36.945 0 1.3l-.109.109a.917.917 0 0 1-1.3 0a1.45 1.45 0 0 0-1.58-.313A1.46 1.46 0 0 0 9 13.934V14a1 1 0 0 1-2 0v-.067a1.47 1.47 0 0 0-.902-1.35a1.45 1.45 0 0 0-1.58.313a.917.917 0 0 1-1.3 0l-.109-.11a.93.93 0 0 1 0-1.31a1.45 1.45 0 0 0 .313-1.58a1.46 1.46 0 0 0-1.35-.901h-.068a1 1 0 0 1 0-2h.068a1.47 1.47 0 0 0 1.35-.902c.224-.54.103-1.17-.313-1.58a.917.917 0 0 1 0-1.3l.109-.11a.93.93 0 0 1 1.31 0a1.45 1.45 0 0 0 1.58.314c.543-.225.902-.756.902-1.35V2z" clipRule="evenodd"/>
            </svg>
            Pengaturan
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import Chart from '../components/Chart';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalArsip: 0,
    kelahiran: 0,
    pernikahan: 0,
    perceraian: 0,
    kematian: 0,
    arsipBulanIni: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };
  // Icons for stat cards
  const icons = {
    archive: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="currentColor" d="M10.25 11a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5zM3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v1.5c0 .78-.397 1.467-1 1.871v8.629A3.75 3.75 0 0 1 16.25 21h-8.5A3.75 3.75 0 0 1 4 17.25V8.621A2.25 2.25 0 0 1 3 6.75zM5.5 9v8.25a2.25 2.25 0 0 0 2.25 2.25h8.5a2.25 2.25 0 0 0 2.25-2.25V9zm-.25-4.5a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75z"/>
      </svg>
    ),
    checkmark: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4m1 4l2 2l4-4"/>
      </svg>
    ),
    birth: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
        <path fill="currentColor" d="M15 3v10H1V3zm1-1H0v12h16z"/><path fill="currentColor" d="M8 5h6v1H8zm0 2h6v1H8zm0 2h3v1H8zM5.4 7H5v-.1c.6-.2 1-.8 1-1.4C6 4.7 5.3 4 4.5 4S3 4.7 3 5.5c0 .7.4 1.2 1 1.4V7h-.4C2.7 7 2 7.7 2 8.6V11h5V8.6C7 7.7 6.3 7 5.4 7"/>
      </svg>
    ),
    calendar: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 4h-2V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m1 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7h16Zm0-9H4V7a1 1 0 0 1 1-1h2v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h2a1 1 0 0 1 1 1Z"/>
      </svg>
    ),
    divorce: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 2048 2048">
        <path fill="currentColor" d="M1040 946q119 46 217 128t164 191l-93 93q-42-77-102-138t-132-105t-155-67t-171-24q-88 0-170 23t-153 64t-129 100t-100 130t-65 153t-23 170H0q0-120 35-231t101-205t156-167t204-115q-113-74-176-186t-64-248q0-106 40-199t109-163T568 40T768 0t199 40t163 109t110 163t40 200q0 66-16 129t-48 119t-75 103t-101 83M384 512q0 80 30 149t82 122t122 83t150 30q79 0 149-30t122-82t83-122t30-150q0-79-30-149t-82-122t-123-83t-149-30q-80 0-149 30t-122 82t-83 123t-30 149m1661 990l-226 226l226 227l-90 90l-227-226l-227 227l-90-91l227-227l-227-227l90-90l227 227l227-227z"/>
      </svg>
    ),
    death: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
        <path fill="currentColor" d="M15 3v10H1V3zm1-1H0v12h16z"/><path fill="currentColor" d="M8 5h6v1H8zm0 2h6v1H8zm0 2h3v1H8zM5.4 7H5v-.1c.6-.2 1-.8 1-1.4C6 4.7 5.3 4 4.5 4S3 4.7 3 5.5c0 .7.4 1.2 1 1.4V7h-.4C2.7 7 2 7.7 2 8.6V11h5V8.6C7 7.7 6.3 7 5.4 7"/>
      </svg>
    )
  };

  return (
    <div className="space-y-8">
      <div style={{ marginLeft: '45px' }}>
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">E-ARSIP DUKCAPIL | Dashboard</h1>
          <p className="text-blue-100 mt-2">Selamat datang di sistem arsip digital DUKCAPIL</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Arsip Kependudukan"
            value={loading ? '...' : stats.totalArsip.toString()}
            icon={icons.archive}
            color="custom"
          />
          <StatCard
            title="Total Akta Pernikahan"
            value={loading ? '...' : stats.pernikahan.toString()}
            icon={icons.checkmark}
            color="green"
          />
          <StatCard
            title="Total Akta Kelahiran"
            value={loading ? '...' : stats.kelahiran.toString()}
            icon={icons.birth}
            color="blue"
          />
          <StatCard
            title="Arsip Bulan ini"
            value={loading ? '...' : stats.arsipBulanIni.toString()}
            icon={icons.calendar}
            color="custom"
          />
          <StatCard
            title="Total Akta Perceraian"
            value={loading ? '...' : stats.perceraian.toString()}
            icon={icons.divorce}
            color="green"
          />
          <StatCard
            title="Total Akta Kematian"
            value={loading ? '...' : stats.kematian.toString()}
            icon={icons.death}
            color="blue"
          />
        </div>

        {/* Chart Section */}
        <div>
          <Chart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

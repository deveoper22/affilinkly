import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaCrown, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaWallet, 
  FaChartBar, 
  FaArrowUp, 
  FaArrowDown,
  FaEye,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCalendarAlt,
  FaUserCheck,
  FaUserClock,
  FaBan,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPercentage
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalMasterAffiliates: 0,
    totalPayouts: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    suspendedAffiliates: 0
  });

  const [recentData, setRecentData] = useState({
    recentAffiliates: [],
    recentMasterAffiliates: [],
    recentPayouts: []
  });

  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    loadAdminOverview();
  }, [timeFilter]);

  const loadAdminOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/admin-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      // Check if response has success and data fields
      if (response.data.success && response.data.data) {
        const { overview, affiliates = [], masterAffiliates = [], payouts = [] } = response.data.data;
        
        console.log('Overview:', overview);
        console.log('Affiliates:', affiliates);
        console.log('Payouts:', payouts);

        // Calculate stats from the overview object
        const totalAffiliates = overview?.totalAffiliates || 0;
        const totalMasterAffiliates = overview?.totalMasterAffiliates || 0;
        const totalPayouts = overview?.totalPayouts || 0;
        const totalEarnings = overview?.totalEarnings || 0;
        const pendingEarnings = overview?.pendingPayouts || 0;
        const paidEarnings = overview?.totalPayoutAmount || 0;

        // Calculate status counts from affiliates array
        const activeAffiliates = affiliates.filter(aff => aff.status === 'active').length || 0;
        const pendingAffiliates = affiliates.filter(aff => aff.status === 'pending').length || 0;
        const suspendedAffiliates = affiliates.filter(aff => aff.status === 'suspended' || aff.status === 'banned').length || 0;

        setStats({
          totalAffiliates,
          totalMasterAffiliates,
          totalPayouts,
          totalEarnings,
          pendingEarnings,
          paidEarnings,
          activeAffiliates,
          pendingAffiliates,
          suspendedAffiliates
        });

        // Set recent data
        setRecentData({
          recentAffiliates: Array.isArray(affiliates) ? affiliates.slice(0, 5) : [],
          recentMasterAffiliates: Array.isArray(masterAffiliates) ? masterAffiliates.slice(0, 5) : [],
          recentPayouts: Array.isArray(payouts) ? payouts.slice(0, 5) : []
        });
      } else {
        console.error('Invalid response structure:', response.data);
      }

    } catch (error) {
      console.error('Error loading admin overview:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaUserClock },
      suspended: { color: 'bg-red-100 text-red-800', icon: FaBan },
      banned: { color: 'bg-red-100 text-red-800', icon: FaBan },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: FaUserClock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getPayoutStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const mainStats = [
    {
      title: "Total Affiliates",
      value: stats.totalAffiliates,
      description: "All registered affiliates",
      change: "+12%",
      trend: "up",
      icon: FaUsers,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Master Affiliates",
      value: stats.totalMasterAffiliates,
      description: "Master level affiliates",
      change: "+8%",
      trend: "up",
      icon: FaCrown,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Total Payouts",
      value: stats.totalPayouts,
      description: "All time payouts processed",
      change: "+15%",
      trend: "up",
      icon: FaMoneyBillWave,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Total Earnings",
      value: stats.totalEarnings,
      description: "Combined affiliate earnings",
      change: "+20%",
      trend: "up",
      icon: FaChartLine,
      color: "orange",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      isCurrency: true
    }
  ];

  const earningsStats = [
    {
      title: "Pending Earnings",
      value: stats.pendingEarnings,
      description: "Awaiting payout",
      icon: FaWallet,
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      isCurrency: true
    },
    {
      title: "Paid Earnings",
      value: stats.paidEarnings,
      description: "Successfully paid out",
      icon: FaCheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      isCurrency: true
    }
  ];

  const statusStats = [
    {
      title: "Active Affiliates",
      value: stats.activeAffiliates,
      description: "Currently active",
      percentage: stats.totalAffiliates ? ((stats.activeAffiliates / stats.totalAffiliates) * 100).toFixed(1) : 0,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Pending Approval",
      value: stats.pendingAffiliates,
      description: "Awaiting verification",
      percentage: stats.totalAffiliates ? ((stats.pendingAffiliates / stats.totalAffiliates) * 100).toFixed(1) : 0,
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "Suspended/Banned",
      value: stats.suspendedAffiliates,
      description: "Inactive accounts",
      percentage: stats.totalAffiliates ? ((stats.suspendedAffiliates / stats.totalAffiliates) * 100).toFixed(1) : 0,
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    }
  ];

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-500 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading admin overview...</p>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-500 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          <div className="w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
                  <p className="text-gray-600 mt-1">Complete overview of your affiliate program</p>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {mainStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Second Row - Earnings and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Earnings Stats */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {earningsStats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(stat.value)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stat.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ 
                            width: `${stats.totalEarnings > 0 ? (stat.value / stats.totalEarnings * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.totalEarnings > 0 
                          ? `${((stat.value / stats.totalEarnings) * 100).toFixed(1)}% of total earnings` 
                          : 'No earnings yet'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Overview */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliate Status</h3>
                <div className="space-y-4">
                  {statusStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${stat.bgColor} ${stat.textColor} mr-3`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                          <p className="text-xs text-gray-500">{stat.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-semibold">{stats.totalAffiliates}</span> affiliates
                  </p>
                </div>
              </div>
            </div>

            {/* Third Row - Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Affiliates */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaUsers className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Affiliates
                  </h3>
                  <span className="text-xs text-gray-500">
                    {recentData.recentAffiliates.length} shown
                  </span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentData.recentAffiliates.length > 0 ? (
                      recentData.recentAffiliates.map((affiliate, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {affiliate.firstName?.charAt(0)}{affiliate.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {affiliate.firstName} {affiliate.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{affiliate.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(affiliate.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(affiliate.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No affiliates found</p>
                      </div>
                    )}
                  </div>
                  {recentData.recentAffiliates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                      <button 
                        onClick={loadAdminOverview}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View All Affiliates →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Master Affiliates */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaCrown className="w-5 h-5 mr-2 text-purple-600" />
                    Recent Masters
                  </h3>
                  <span className="text-xs text-gray-500">
                    {recentData.recentMasterAffiliates.length} shown
                  </span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentData.recentMasterAffiliates.length > 0 ? (
                      recentData.recentMasterAffiliates.map((master, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {master.firstName?.charAt(0)}{master.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {master.firstName} {master.lastName}
                              </p>
                              <p className="text-xs text-gray-500">Code: {master.affiliateCode || master.masterCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(master.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(master.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FaCrown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No master affiliates found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Payouts */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaMoneyBillWave className="w-5 h-5 mr-2 text-green-600" />
                    Recent Payouts
                  </h3>
                  <span className="text-xs text-gray-500">
                    {recentData.recentPayouts.length} shown
                  </span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentData.recentPayouts.length > 0 ? (
                      recentData.recentPayouts.map((payout, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(payout.amount)}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {payout.paymentMethod?.replace('_', ' ') || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            {getPayoutStatusBadge(payout.status)}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(payout.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <FaMoneyBillWave className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No payouts found</p>
                      </div>
                    )}
                  </div>
                  {recentData.recentPayouts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View Payout History →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadAdminOverview}
                className="px-6 py-3 bg-blue-600 cursor-pointer text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;
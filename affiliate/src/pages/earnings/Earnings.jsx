import React, { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaCalendarAlt,
  FaEye,
  FaRegClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFileExport,
  FaSync,
  FaUserPlus,
  FaUsers,
  FaMousePointer,
  FaCrown,
  FaCoins,
  FaUserFriends,
  FaPercentage,
  FaIdCard,
  FaUserTag,
  FaHistory,
  FaExchangeAlt,
  FaUserGraduate,
  FaWallet,
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaFileCsv,
  FaFileExcel,
  FaPrint,
  FaStar,
  FaGem,
  FaMedal,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaCircle,
  FaClock,
  FaCheckDouble,
  FaBan,
  FaHourglassHalf,
  FaCreditCard
} from 'react-icons/fa';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Earnings = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'earnedAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [selectedView, setSelectedView] = useState('all'); // all, players, affiliates
  const [expandedRow, setExpandedRow] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    statuses: [],
    sourceTypes: []
  });

  // Master Affiliate Earnings data state
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    earningsThisMonth: 0,
    monthlyGrowth: 0,
    totalSubAffiliates: 0,
    activeSubAffiliates: 0,
    conversionRate: 0,
    commissionRate: 0,
    depositRate: 0,
    cpaRate: 0,
    overrideCommission: 0,
    availableForPayout: 0,
    canRequestPayout: false,
    minimumPayout: 1000,
    earningsHistory: [],
    earningsSummary: {
      total: 0,
      pending: 0,
      paid: 0,
      byType: {}
    },
    subAffiliatePerformance: [],
    registeredUsers: [],
    playerStats: {
      totalPlayers: 0,
      playersWithMultipleEarnings: 0,
      topPlayers: []
    },
    affiliateStats: {
      totalAffiliates: 0,
      topAffiliates: []
    },
    byMonth: {},
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load earnings data
  useEffect(() => {
    loadEarningsData();
  }, [timeRange, currentPage, statusFilter, typeFilter, sourceTypeFilter, searchTerm]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('masterAffiliateToken');
      
      if (!token) {
        toast.error('Please login again');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      
      // Date range based on timeRange
      if (timeRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch(timeRange) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        if (startDate) {
          params.append('startDate', startDate.toISOString());
        }
      } else if (dateRange.start) {
        params.append('startDate', new Date(dateRange.start).toISOString());
      }
      
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        params.append('endDate', endDate.toISOString());
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (sourceTypeFilter !== 'all') {
        params.append('sourceType', sourceTypeFilter);
      }
      
      if (amountRange.min) {
        params.append('minAmount', amountRange.min);
      }
      
      if (amountRange.max) {
        params.append('maxAmount', amountRange.max);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      params.append('sortBy', sortConfig.key);
      params.append('sortOrder', sortConfig.direction);

      // Fetch comprehensive earnings data
      const response = await axios.get(
        `${base_url}/api/master-affiliate/earnings/complete?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        
        // Update filter options
        setFilterOptions({
          types: data.filters?.available?.types || [],
          statuses: data.filters?.available?.statuses || [],
          sourceTypes: data.filters?.available?.sourceTypes || []
        });

        // Calculate monthly growth
        const months = Object.keys(data.stats?.byMonth || {}).sort();
        let monthlyGrowth = 0;
        if (months.length >= 2) {
          const currentMonth = data.stats?.byMonth[months[months.length - 1]]?.total || 0;
          const previousMonth = data.stats?.byMonth[months[months.length - 2]]?.total || 0;
          if (previousMonth > 0) {
            monthlyGrowth = ((currentMonth - previousMonth) / previousMonth) * 100;
          } else if (currentMonth > 0) {
            monthlyGrowth = 100;
          }
        }

        setEarningsData({
          totalEarnings: data.stats?.totalEarnings || 0,
          pendingEarnings: data.stats?.pendingEarnings || 0,
          paidEarnings: data.stats?.paidEarnings || 0,
          earningsThisMonth: data.stats?.byMonth[Object.keys(data.stats?.byMonth || {}).pop()]?.total || 0,
          monthlyGrowth: monthlyGrowth,
          totalSubAffiliates: data.stats?.affiliateStats?.totalAffiliates || 0,
          activeSubAffiliates: data.stats?.affiliateStats?.topAffiliates?.filter(a => a.affiliateInfo?.status === 'active').length || 0,
          conversionRate: data.stats?.totalEarnings > 0 ? (data.stats?.playerStats?.totalPlayers / data.stats?.totalEarnings) * 100 : 0,
          commissionRate: 10, // This might come from profile
          overrideCommission: 5, // This might come from profile
          availableForPayout: data.stats?.pendingEarnings || 0,
          canRequestPayout: (data.stats?.pendingEarnings || 0) >= 2000,
          minimumPayout: 2000,
          earningsHistory: data.earnings || [],
          earningsSummary: {
            total: data.stats?.totalEarnings || 0,
            pending: data.stats?.pendingEarnings || 0,
            paid: data.stats?.paidEarnings || 0,
            byType: data.stats?.byType || {}
          },
          subAffiliatePerformance: data.stats?.affiliateStats?.topAffiliates || [],
          playerStats: data.stats?.playerStats || {
            totalPlayers: 0,
            playersWithMultipleEarnings: 0,
            topPlayers: []
          },
          affiliateStats: data.stats?.affiliateStats || {
            totalAffiliates: 0,
            topAffiliates: []
          },
          byMonth: data.stats?.byMonth || {},
          pagination: data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
      
      let errorMessage = 'Failed to load earnings data';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    loadEarningsData();
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ml-1 text-purple-600" /> : 
      <FaSortDown className="ml-1 text-purple-600" />;
  };

  const exportData = async (format = 'csv') => {
    try {
      const token = localStorage.getItem('masterAffiliateToken');
      const response = await axios.get(
        `${base_url}/api/master-affiliate/earnings/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        if (format === 'csv') {
          // Convert to CSV and download
          const csvContent = convertToCSV(response.data.data);
          downloadFile(csvContent, response.data.filename || 'earnings.csv', 'text/csv');
        } else {
          // Download as JSON
          downloadFile(
            JSON.stringify(response.data.data, null, 2),
            `earnings_${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
          );
        }
        toast.success('Export successful!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSourceTypeFilter('all');
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setCurrentPage(1);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    return formatDateShort(dateString);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: FaHourglassHalf,
        bgGlow: 'shadow-amber-100'
      },
      paid: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: FaCheckDouble,
        bgGlow: 'shadow-emerald-100'
      },
      failed: { 
        color: 'bg-rose-50 text-rose-700 border-rose-200', 
        icon: FaBan,
        bgGlow: 'shadow-rose-100'
      },
      processing: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: FaClock,
        bgGlow: 'shadow-blue-100'
      },
      completed: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: FaCheckCircle,
        bgGlow: 'shadow-emerald-100'
      },
      cancelled: { 
        color: 'bg-rose-50 text-rose-700 border-rose-200', 
        icon: FaTimesCircle,
        bgGlow: 'shadow-rose-100'
      },
      active: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: FaCheckCircle,
        bgGlow: 'shadow-emerald-100'
      },
      inactive: { 
        color: 'bg-gray-50 text-gray-700 border-gray-200', 
        icon: FaCircle,
        bgGlow: 'shadow-gray-100'
      },
      suspended: { 
        color: 'bg-rose-50 text-rose-700 border-rose-200', 
        icon: FaBan,
        bgGlow: 'shadow-rose-100'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm ${config.bgGlow}`}>
        <IconComponent className="w-3 h-3 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      'override_commission': { 
        color: 'bg-purple-50 text-purple-700 border-purple-200', 
        label: 'Override',
        icon: FaStar,
        bgGlow: 'shadow-purple-100'
      },
      'bonus': { 
        color: 'bg-green-50 text-green-700 border-green-200', 
        label: 'Bonus',
        icon: FaGem,
        bgGlow: 'shadow-green-100'
      },
      'incentive': { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        label: 'Incentive',
        icon: FaTrophy,
        bgGlow: 'shadow-blue-100'
      },
      'bet_commission': { 
        color: 'bg-orange-50 text-orange-700 border-orange-200', 
        label: 'Bet Commission',
        icon: FaMoneyBillWave,
        bgGlow: 'shadow-orange-100'
      },
      'deposit_commission': { 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        label: 'Deposit',
        icon: FaCreditCard,
        bgGlow: 'shadow-indigo-100'
      },
      'withdrawal_commission': { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Withdrawal',
        icon: FaExchangeAlt,
        bgGlow: 'shadow-red-100'
      },
      'registration': { 
        color: 'bg-teal-50 text-teal-700 border-teal-200', 
        label: 'Registration',
        icon: FaUserPlus,
        bgGlow: 'shadow-teal-100'
      },
      'first_deposit_commission': { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        label: 'First Deposit',
        icon: FaMedal,
        bgGlow: 'shadow-emerald-100'
      },
      'other': { 
        color: 'bg-gray-50 text-gray-700 border-gray-200', 
        label: 'Other',
        icon: FaCircle,
        bgGlow: 'shadow-gray-100'
      }
    };
    
    const config = typeConfig[type] || typeConfig.other;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm ${config.bgGlow}`}>
        <IconComponent className="w-3 h-3 mr-1.5" />
        {config.label}
      </span>
    );
  };

  const toggleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handlePayoutRequest = () => {
    toast.success('Payout request submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-20">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`transition-all font-poppins duration-500 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}>
          <div className="py-5">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Master Earnings Overview
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm flex items-center">
                    <FaCrown className="text-amber-500 mr-2" />
                    Track your override commissions and sub-affiliate network earnings
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                  <button
                    onClick={() => exportData('csv')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow"
                  >
                    <FaFileCsv className="w-4 h-4 text-green-600" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow"
                  >
                    <FaFileExcel className="w-4 h-4 text-green-600" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={loadEarningsData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow"
                  >
                    <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                  { value: 'all', label: 'All Time' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-2 rounded-lg cursor-pointer font-medium transition-all duration-300 ${
                      timeRange === range.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Total Earnings</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(earningsData.totalEarnings)}</p>
                    <p className="text-xs text-white/70 mt-1 flex items-center">
                      <FaChartLine className="mr-1" />
                      {earningsData.monthlyGrowth > 0 ? (
                        <span className="flex items-center">
                          <FaArrowUp className="mr-0.5" /> {earningsData.monthlyGrowth.toFixed(1)}% this month
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FaArrowDown className="mr-0.5" /> {Math.abs(earningsData.monthlyGrowth).toFixed(1)}% this month
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaMoneyBillWave className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(earningsData.pendingEarnings)}</p>
                    <p className="text-xs text-white/70 mt-1">Awaiting clearance</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaRegClock className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Paid</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(earningsData.paidEarnings)}</p>
                    <p className="text-xs text-white/70 mt-1">Successfully paid</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaCheckCircle className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Players/Affiliates</p>
                    <p className="text-2xl font-bold mt-1">{earningsData.playerStats.totalPlayers} / {earningsData.affiliateStats.totalAffiliates}</p>
                    <p className="text-xs text-white/70 mt-1">Players with deposits: {earningsData.playerStats.playersWithMultipleEarnings}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaUsers className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <FaFilter className={`w-4 h-4 ${showFilters ? 'text-purple-600' : ''}`} />
                  <span className="font-medium">Filters</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {[
                      statusFilter !== 'all' && 'Status',
                      typeFilter !== 'all' && 'Type',
                      sourceTypeFilter !== 'all' && 'Source',
                      searchTerm && 'Search',
                      dateRange.start && 'Date',
                      amountRange.min && 'Amount'
                    ].filter(Boolean).length} active
                  </span>
                </button>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="text"
                        placeholder="Search by description, player ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      {filterOptions.statuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      {filterOptions.types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Source Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                    <select
                      value={sourceTypeFilter}
                      onChange={(e) => setSourceTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Sources</option>
                      {filterOptions.sourceTypes.map(source => (
                        <option key={source} value={source}>{source.charAt(0).toUpperCase() + source.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                </div>
              )}
            </div>

            {/* View Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <div className="flex space-x-6">
                <button
                  onClick={() => setSelectedView('all')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    selectedView === 'all'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaHistory />
                  <span>All Transactions</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {earningsData.pagination.totalItems}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedView('players')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    selectedView === 'players'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaUserTag />
                  <span>By Player</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {earningsData.playerStats.totalPlayers}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedView('affiliates')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    selectedView === 'affiliates'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaUserGraduate />
                  <span>By Affiliate</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {earningsData.affiliateStats.totalAffiliates}
                  </span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
              {selectedView === 'all' && (
                <>
                  {/* Earnings History Table - Enhanced Design */}
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="p-12 text-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600 mx-auto"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FaMoneyBillWave className="text-purple-600 text-xl opacity-50" />
                          </div>
                        </div>
                        <p className="text-gray-600 mt-4 font-medium">Loading earnings history...</p>
                        <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your data</p>
                      </div>
                    ) : earningsData.earningsHistory.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-gray-300 mb-4">
                          <FaHistory className="w-16 h-16 mx-auto" />
                        </div>
                        <p className="text-gray-700 font-medium text-lg">No earnings found</p>
                        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                          {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                            ? 'Try adjusting your filters to see more results' 
                            : 'Your earnings will appear here once you start earning commissions'}
                        </p>
                        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                          <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handleSort('earnedAt')}>
                              <div className="flex items-center">
                                <FaCalendarAlt className="mr-2 text-gray-400" />
                                Date & Time {getSortIcon('earnedAt')}
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center">
                                <FaUserTag className="mr-2 text-gray-400" />
                                Source
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center">
                                <FaInfoCircle className="mr-2 text-gray-400" />
                                Type & Description
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handleSort('amount')}>
                              <div className="flex items-center">
                                <FaMoneyBillWave className="mr-2 text-gray-400" />
                                Amount {getSortIcon('amount')}
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center">
                                <FaRegClock className="mr-2 text-gray-400" />
                                Status
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center">
                                <FaEye className="mr-2 text-gray-400" />
                                Details
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {earningsData.earningsHistory.map((earning, index) => (
                            <React.Fragment key={earning._id}>
                              <tr 
                                className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 cursor-pointer group ${
                                  expandedRow === earning._id ? 'bg-purple-50' : ''
                                } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                onClick={() => toggleRowExpand(earning._id)}
                                onMouseEnter={() => setHoveredRow(earning._id)}
                                onMouseLeave={() => setHoveredRow(null)}
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-3 ${
                                      hoveredRow === earning._id ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                                    }`}></div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        {formatDateShort(earning.earnedAt)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-start space-x-3">
                                    {earning.playerid ? (
                                      <>
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                          <FaIdCard className="text-purple-600 w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            Player
                                          </div>
                                          <div className="text-xs text-gray-600 font-mono mt-0.5">
                                            {earning.playerid}
                                          </div>
                                          {earning.playerInfo && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {earning.playerInfo.firstName} {earning.playerInfo.lastName}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : earning.sourceAffiliateInfo ? (
                                      <>
                                        <div className="bg-amber-100 p-2 rounded-lg">
                                          <FaUserGraduate className="text-amber-600 w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            Affiliate
                                          </div>
                                          <div className="text-xs font-medium text-gray-800 mt-0.5">
                                            {earning.sourceAffiliateInfo.firstName} {earning.sourceAffiliateInfo.lastName}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Code: {earning.sourceAffiliateInfo.masterCode}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="bg-gray-100 p-2 rounded-lg">
                                          <FaCrown className="text-gray-600 w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            System
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Master Affiliate
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-start space-x-3">
                                    <div>
                                      {getTypeBadge(earning.type)}
                                      <div className="text-sm text-gray-700 mt-2 font-medium">
                                        {earning.typeLabel || earning.type.split('_').map(word => 
                                          word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                        {earning.description || 'Commission earned from sub-affiliate network'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    {formatCurrency(earning.amount)}
                                  </div>
                                  {earning.sourceAmount > 0 && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                                      <FaArrowUp className="w-3 h-3 mr-1 text-green-500" />
                                      From {formatCurrency(earning.sourceAmount)}
                                    </div>
                                  )}
                                  {earning.overrideRate > 0 && (
                                    <div className="text-xs text-purple-600 mt-1 flex items-center">
                                      <FaPercentage className="w-3 h-3 mr-1" />
                                      {earning.overrideRate}% override
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <span className='px-[10px] py-[7px] bg-green-100 text-[12px] rounded-[20px] border-[1px] border-green-500'>
                                      Completed
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpand(earning._id);
                                    }}
                                    className={`text-purple-600 hover:text-purple-700 transition-all duration-200 transform hover:scale-110 ${
                                      expandedRow === earning._id ? 'rotate-180' : ''
                                    }`}
                                  >
                                    <FaInfoCircle className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                              {expandedRow === earning._id && (
                                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-purple-200">
                                  <td colSpan="6" className="px-4 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      {earning.sourceAffiliateInfo && (
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Source Affiliate</p>
                                          <p className="text-sm font-medium">{earning.sourceAffiliateInfo.firstName} {earning.sourceAffiliateInfo.lastName}</p>
                                          <p className="text-xs text-gray-600 mt-1">{earning.sourceAffiliateInfo.email}</p>
                                          <p className="text-xs text-gray-600 mt-1">Code: <span className="font-mono">{earning.sourceAffiliateInfo.masterCode}</span></p>
                                          <p className="text-xs text-gray-600 mt-1">Phone: {earning.sourceAffiliateInfo.phone || 'N/A'}</p>
                                        </div>
                                      )}
                                      {earning.playerInfo && (
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Player Info</p>
                                          <p className="text-sm font-medium">{earning.playerInfo.firstName} {earning.playerInfo.lastName}</p>
                                          <p className="text-xs text-gray-600 mt-1">{earning.playerInfo.email}</p>
                                          <p className="text-xs text-gray-600 mt-1">{earning.playerInfo.phone || 'N/A'}</p>
                                          {earning.playerInfo.country && (
                                            <p className="text-xs text-gray-600 mt-1">Country: {earning.playerInfo.country}</p>
                                          )}
                                        </div>
                                      )}
                                      <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Commission Details</p>
                                        {earning.overrideRate > 0 && (
                                          <p className="text-sm flex items-center">
                                            <FaPercentage className="mr-1 text-purple-600" />
                                            Override Rate: {earning.overrideRate}%
                                          </p>
                                        )}
                                        {earning.sourceType && (
                                          <p className="text-xs text-gray-600 mt-2">Source Type: {earning.sourceType}</p>
                                        )}
                                        {earning.paidAt && (
                                          <p className="text-xs text-gray-600 mt-2">Paid Date: {formatDate(earning.paidAt)}</p>
                                        )}
                                        {earning.calculatedAt && (
                                          <p className="text-xs text-gray-600 mt-2">Calculated: {formatDate(earning.calculatedAt)}</p>
                                        )}
                                      </div>
                                      <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Transaction IDs</p>
                                        <p className="text-xs text-gray-600">Earning ID:</p>
                                        <p className="text-xs font-mono bg-gray-50 p-1 rounded mt-1">{earning._id}</p>
                                        {earning.payoutId && (
                                          <>
                                            <p className="text-xs text-gray-600 mt-2">Payout ID:</p>
                                            <p className="text-xs font-mono bg-gray-50 p-1 rounded mt-1">{earning.payoutId}</p>
                                          </>
                                        )}
                                        {earning.relatedTransactionId && (
                                          <>
                                            <p className="text-xs text-gray-600 mt-2">Related Transaction:</p>
                                            <p className="text-xs font-mono bg-gray-50 p-1 rounded mt-1">{earning.relatedTransactionId}</p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {earning.notes && (
                                      <div className="mt-4 bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Notes</p>
                                        <p className="text-sm text-gray-700">{earning.notes}</p>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {selectedView === 'players' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaTrophy className="text-amber-500 mr-2" />
                    Top Players by Earnings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {earningsData.playerStats.topPlayers.map((player, index) => (
                      <div key={player.playerId} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-amber-100 text-amber-700' :
                              index === 1 ? 'bg-gray-200 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{player.playerInfo?.firstName} {player.playerInfo?.lastName}</span>
                                {index === 0 && <FaCrown className="text-amber-500 w-4 h-4" />}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">Player ID: <span className="font-mono">{player.playerId}</span></p>
                              {player.playerInfo?.email && (
                                <p className="text-xs text-gray-500 mt-1">{player.playerInfo.email}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">{formatCurrency(player.total)}</p>
                            <p className="text-xs text-gray-500">{player.count} transaction(s)</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                          <span>First: {formatDateShort(player.firstEarning)}</span>
                          <span>Last: {formatDateShort(player.lastEarning)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedView === 'affiliates' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaUserGraduate className="text-purple-600 mr-2" />
                    Top Affiliates by Earnings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {earningsData.affiliateStats.topAffiliates.map((affiliate, index) => (
                      <div key={affiliate.affiliateId} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-amber-100 text-amber-700' :
                              index === 1 ? 'bg-gray-200 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">
                                  {affiliate.affiliateInfo?.firstName} {affiliate.affiliateInfo?.lastName}
                                </span>
                                {affiliate.affiliateInfo?.status === 'active' && (
                                  <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Active</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{affiliate.affiliateInfo?.email}</p>
                              <p className="text-xs text-gray-500 mt-1">Code: {affiliate.affiliateInfo?.masterCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">{formatCurrency(affiliate.total)}</p>
                            <p className="text-xs text-gray-500">{affiliate.count} transaction(s)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {earningsData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span>Previous</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-700 font-medium">
                      Page {currentPage} of {earningsData.pagination.totalPages}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      {earningsData.pagination.totalItems} total items
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, earningsData.pagination.totalPages))}
                    disabled={currentPage === earningsData.pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-sm text-gray-500 mb-3 flex items-center">
                  <FaChartLine className="mr-2 text-purple-600" />
                  Earnings by Type
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {Object.entries(earningsData.earningsSummary.byType).map(([type, data]) => (
                    <div key={type} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-gray-600 truncate">{data.label || type}</span>
                      <span className="font-semibold text-purple-600 ml-2">{formatCurrency(data.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-sm text-gray-500 mb-3 flex items-center">
                  <FaCalendarAlt className="mr-2 text-purple-600" />
                  Monthly Breakdown
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {Object.entries(earningsData.byMonth).sort().reverse().map(([month, data]) => (
                    <div key={month} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-gray-600">{data.month || month}</span>
                      <span className="font-semibold text-purple-600">{formatCurrency(data.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-sm text-gray-500 mb-3 flex items-center">
                  <FaUsers className="mr-2 text-purple-600" />
                  Quick Stats
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Players</span>
                    <span className="font-semibold text-purple-600">{earningsData.playerStats.totalPlayers}</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Affiliates</span>
                    <span className="font-semibold text-purple-600">{earningsData.affiliateStats.totalAffiliates}</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Avg per Transaction</span>
                    <span className="font-semibold text-purple-600">
                      {earningsData.earningsHistory.length > 0 
                        ? formatCurrency(earningsData.totalEarnings / earningsData.earningsHistory.length)
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Earnings;
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
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaChartBar,
  FaIdCard,
  FaMoneyBill,
  FaDatabase,
  FaExchangeAlt,
  FaWallet
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Deposithistory = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({
    totalDepositCommissions: 0,
    pendingDeposits: 0,
    paidDeposits: 0,
    totalCount: 0,
    averageDeposit: 0
  });
  const [trends, setTrends] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load deposit history data
  useEffect(() => {
    loadDepositHistory();
  }, [currentPage, timeRange]);

  const loadDepositHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('masterAffiliateToken');
      
      const response = await axios.get(`${base_url}/api/master-affiliate/deposit-history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        }
      });

      if (response.data.success) {
        const depositsData = response.data.deposits || [];
        setDeposits(depositsData);
        setStats(response.data.summary || {});
        setTrends(response.data.trends || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error loading deposit history:', error);
      toast.error('Failed to load deposit history data');
    } finally {
      setIsLoading(false);
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '৳0';
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaRegClock, label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'Paid' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: FaExchangeAlt, label: 'Processing' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, label: 'Cancelled' },
      failed: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, label: 'Failed' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getSourceTypeBadge = (sourceType) => {
    const sourceConfig = {
      'deposit_commission': { color: 'bg-blue-100 text-blue-800', label: 'Deposit' },
      'override_commission': { color: 'bg-purple-100 text-purple-800', label: 'Override' },
      'bet_commission': { color: 'bg-green-100 text-green-800', label: 'Bet' },
      'withdrawal_commission': { color: 'bg-red-100 text-red-800', label: 'Withdrawal' }
    };
    
    const config = sourceConfig[sourceType] || { color: 'bg-gray-100 text-gray-800', label: sourceType || 'Other' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const refreshData = () => {
    loadDepositHistory();
    toast.success('Data refreshed!');
  };

  const exportData = () => {
    const csvData = [
      ['Date', 'Amount', 'Description', 'Source Type', 'Status', 'Override Rate', 'Source Affiliate', 'Paid Date'],
      ...deposits.map(deposit => [
        formatDate(deposit.date),
        formatCurrency(deposit.amount),
        deposit.description || 'N/A',
        deposit.sourceType || 'N/A',
        deposit.status || 'N/A',
        `${deposit.overrideRate || 0}%`,
        deposit.sourceAffiliateInfo ? 
          `${deposit.sourceAffiliateInfo.firstName} ${deposit.sourceAffiliateInfo.lastName}` : 
          deposit.sourceAffiliate || 'N/A',
        deposit.paidAt ? formatDate(deposit.paidAt) : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposit-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully!');
  };

  // Filter deposits based on search term
  const filteredDeposits = deposits.filter(deposit => {
    const searchLower = searchTerm.toLowerCase();
    return (
      deposit.description?.toLowerCase().includes(searchLower) ||
      deposit.sourceType?.toLowerCase().includes(searchLower) ||
      (deposit.sourceAffiliateInfo?.firstName?.toLowerCase() + ' ' + deposit.sourceAffiliateInfo?.lastName?.toLowerCase()).includes(searchLower) ||
      deposit.sourceAffiliateInfo?.email?.toLowerCase().includes(searchLower) ||
      deposit.sourceAffiliateInfo?.masterCode?.toLowerCase().includes(searchLower)
    );
  });

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
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Deposit Commission History
                  </h1>
                  <p className="text-gray-600 mt-2 text-sm flex items-center">
                    <FaMoneyBill className="text-blue-500 mr-2" />
                    Track all deposit commissions earned from your sub-affiliates
                  </p>
                </div>
                
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <button
                    onClick={refreshData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <FaSync className="text-gray-600" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="mb-8">
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
                    onClick={() => {
                      setTimeRange(range.value);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-[5px] cursor-pointer font-medium transition-all duration-300 ${
                      timeRange === range.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Total Commissions</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalDepositCommissions)}</p>
                    <p className="text-xs text-white/70 mt-2 flex items-center">
                      <FaCoins className="mr-1" />
                      {stats.totalCount} total deposits
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaMoneyBillWave className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Pending Commissions</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingDeposits)}</p>
                    <p className="text-xs text-white/70 mt-2">
                      Awaiting clearance
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaRegClock className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Paid Commissions</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats.paidDeposits)}</p>
                    <p className="text-xs text-white/70 mt-2">
                      Successfully paid out
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaCheckCircle className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Average Commission</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats.averageDeposit)}</p>
                    <p className="text-xs text-white/70 mt-2 flex items-center">
                      <FaChartBar className="mr-1" />
                      Per deposit commission
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaChartLine className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit List Section */}
            <div className="bg-white rounded-[5px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 lg:mb-0">
                    Deposit Commission History
                  </h2>
   
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                     
  <div className="p-8 max-w-md mx-auto">
  {/* Animated progress bar */}
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 animate-shimmer w-1/3"></div>
  </div>
  
  {/* Skeleton content */}
  <div className="space-y-4">
    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
  </div>
  
  <div className="text-center mt-8">
    <p className="text-gray-600 font-medium">Fetching deposit history...</p>
  </div>
</div>

                  </div>
                ) : filteredDeposits.length === 0 ? (
                  <div className="p-8 text-center">
                    <FaMoneyBill className="text-gray-300 text-4xl mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No deposit commissions found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search term' : 'Deposit commissions will appear here as you earn them'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission 
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDeposits.map((deposit) => (
                        <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(deposit.date)}
                              </div>
                              {deposit.paidAt && (
                                <div className="text-xs text-gray-400">
                                  Paid: {formatDate(deposit.paidAt)}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div>
                                {getSourceTypeBadge(deposit.sourceType)}
                              </div>
                              {deposit.sourceAffiliateInfo && (
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-900">
                                    {deposit.sourceAffiliateInfo.firstName} {deposit.sourceAffiliateInfo.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {deposit.sourceAffiliateInfo.email}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center">
                                    <FaIdCard className="mr-1" />
                                    Code: {deposit.sourceAffiliateInfo.masterCode}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(deposit.amount)}
                              </div>
                              {deposit.overrideRate && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <FaPercentage className="mr-1" />
                                  Override Rate: {deposit.overrideRate}%
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredDeposits.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{filteredDeposits.length}</span> of <span className="font-medium">{stats.totalCount}</span> deposits
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                          loadDepositHistory();
                        }}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-[5px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => {
                          setCurrentPage(prev => prev + 1);
                          loadDepositHistory();
                        }}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-[5px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Trends Section */}
            {trends.length > 0 && (
              <div className="mt-8 bg-white rounded-[5px] border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Deposit Trends</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Commissions
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Number of Deposits
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Commission
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends.map((trend, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {trend.month}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {formatCurrency(trend.total)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {trend.count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatCurrency(trend.average)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Deposithistory;
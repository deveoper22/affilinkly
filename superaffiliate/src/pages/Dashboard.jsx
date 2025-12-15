import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaUsers, 
  FaWallet, 
  FaLink, 
  FaChartBar, 
  FaUser, 
  FaArrowUp, 
  FaArrowDown,
  FaDollarSign,
  FaCreditCard,
  FaPercentage,
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaRocket,
  FaGem,
  FaShieldAlt,
  FaEye,
  FaHistory,
  FaExchangeAlt,
  FaUserPlus,
  FaMoneyCheckAlt
} from 'react-icons/fa';
import { FiTrendingUp, FiUsers, FiDollarSign, FiPieChart, FiArrowUpRight } from 'react-icons/fi';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Dashboard = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // Profile states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    affiliateCode: '',
    commissionRate: 0,
    depositRate: 0,
    cpaRate: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    paymentMethod: 'bkash',
    formattedPaymentDetails: {},
    isVerified: false,
    lastLogin: '',
    minimumPayout: 0,
    status: 'active',
    totalPayout: 0,
    pendingPayout: 0
  });

  // Dashboard stats - initialize with zeros
  const [dashboardStats, setDashboardStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    commissionRate: 0,
    depositRate: 0,
    cpaRate: 0,
    minimumPayout: 0,
    availableForPayout: 0,
    daysUntilPayout: 0,
    activeReferrals: 0,
    conversionRate: 0,
    clickCount: 0,
    earningsThisMonth: 0,
    totalBalance: 0,
    totalPeriodChange: 0,
    totalPeriodExpenses: 0,
    totalPeriodIncome: 0,
    balanceChange: 0,
    periodChange: 0,
    expensesChange: 0,
    incomeChange: 0,
    lastMonthBalance: 0,
    lastMonthPeriodChange: 0,
    lastMonthExpenses: 0,
    lastMonthIncome: 0,
    totalPayout: 0,
    pendingPayout: 0,
    recentTransactions: []
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load affiliate data from localStorage and dashboard stats
  useEffect(() => {
    const affiliateData = localStorage.getItem('affiliate');
    if (affiliateData) {
      const parsedData = JSON.parse(affiliateData);
      setProfile({
        ...parsedData,
        commissionRate: parsedData.commissionRate || 0,
        depositRate: parsedData.depositRate || 0,
        cpaRate: parsedData.cpaRate || 200,
        totalPayout: parsedData.totalPayout || 0,
        pendingPayout: parsedData.pendingPayout || 0
      });
    }
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.get(`${base_url}/api/affiliate/dashboard`,  { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.data.success) {
        const stats = response.data.stats;
        setDashboardStats(prevStats => ({
          ...prevStats,
          ...stats,
          totalBalance: stats.totalEarnings || 0,
          totalPeriodChange: stats.pendingEarnings || 0,
          totalPeriodExpenses: stats.paidEarnings || 0,
          totalPeriodIncome: stats.earningsThisMonth || 0,
          balanceChange: stats.balanceChange || 0,
          periodChange: stats.periodChange || 0,
          expensesChange: stats.expensesChange || 0,
          incomeChange: stats.incomeChange || 0,
          lastMonthBalance: stats.lastMonthBalance || 0,
          lastMonthPeriodChange: stats.lastMonthPeriodChange || 0,
          lastMonthExpenses: stats.lastMonthExpenses || 0,
          lastMonthIncome: stats.lastMonthIncome || 0,
          commissionRate: stats.commissionRate || 0,
          depositRate: stats.depositRate || 0,
          cpaRate: stats.cpaRate,
          totalPayout: stats.totalPayout || 0,
          pendingPayout: stats.pendingPayout || 0,
          recentTransactions: stats.recentTransactions || []
        }));
        
        // Set transactions
        setTransactions(stats.recentTransactions || []);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/request`, 
        { amount: dashboardStats.pendingEarnings },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        loadDashboardStats();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(error.response?.data?.message || 'Failed to request payout');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit_commission':
        return <FaMoneyCheckAlt className="text-green-600" />;
      case 'registration_bonus':
        return <FaUserPlus className="text-blue-600" />;
      default:
        return <FaExchangeAlt className="text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'deposit_commission':
        return 'Deposit Commission';
      case 'registration_bonus':
        return 'Registration Bonus';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const isEligibleForPayout = dashboardStats.pendingEarnings >= dashboardStats.minimumPayout;

  const mainStatsCards = [
    {
      title: "Total Earnings",
      value: dashboardStats.totalEarnings,
      description: "Lifetime earnings",
      icon: FiDollarSign,
      color: "gradient-blue",
      trend: dashboardStats.balanceChange,
      gradient: "from-blue-500 to-cyan-500",
      format: 'currency'
    },
    {
      title: "Pending Earnings",
      value: dashboardStats.pendingEarnings,
      description: "Available for payout",
      icon: FaClock,
      color: "gradient-amber",
      trend: dashboardStats.periodChange,
      gradient: "from-amber-500 to-orange-500",
      format: 'currency'
    },
    {
      title: "Total Referrals",
      value: dashboardStats.referralCount,
      description: `${dashboardStats.activeReferrals || 0} active`,
      icon: FiUsers,
      color: "gradient-green",
      trend: 12,
      gradient: "from-green-500 to-emerald-500",
      format: 'number'
    },
    {
      title: "Registration Commission",
      value: dashboardStats.cpaRate,
      description: "Per successful registration",
      icon: FaPercentage,
      color: "gradient-purple",
      trend: 0,
      gradient: "from-purple-500 to-indigo-500",
      format: 'currency'
    }
  ];

  const secondaryStatsCards = [
    {
      title: "Paid Earnings",
      value: dashboardStats.paidEarnings,
      description: "Total received",
      icon: FaCheckCircle,
      color: "emerald",
      gradient: "from-emerald-400 to-green-500",
      format: 'currency'
    },
  ];

  const quickActions = [
    {
      title: "Get Referral Links",
      description: "Generate your unique links",
      icon: FaLink,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      href: "#"
    },
    {
      title: "View Referrals",
      description: "See your referral network",
      icon: FiUsers,
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      href: "#"
    },
    {
      title: "Performance Report",
      description: "Detailed analytics",
      icon: FaChartBar,
      color: "purple",
      gradient: "from-purple-500 to-indigo-500",
      href: "#"
    },
    {
      title: "Payment History",
      description: "View all transactions",
      icon: FaWallet,
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      href: "#",
      onClick: () => setShowAllTransactions(true)
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend > 0) {
      return <BiTrendingUp className="text-green-500 text-lg" />;
    } else if (trend < 0) {
      return <BiTrendingDown className="text-red-500 text-lg" />;
    }
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "text-green-600 bg-green-50 border-green-200";
    if (trend < 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const formatValue = (value, formatType) => {
    switch (formatType) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  const TransactionsTable = () => (
    <div className="bg-white rounded-[10px] border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
            <FaHistory className="text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Your recent commission earnings and bonuses</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAllTransactions(false)}
          className="text-gray-600 hover:text-gray-900 font-medium text-sm"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border-[1px] border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{transaction.description}</div>
                    {transaction.sourceAmount && (
                      <div className="text-xs text-gray-500">
                        Source: {formatCurrency(transaction.sourceAmount)} at {formatPercentage(transaction.commissionRate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {transactions.length} transactions
        </div>
      </div>
    </div>
  );

  const RecentTransactionsPreview = () => (
    <div className="mt-8 bg-white rounded-[10px] border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
            <FaHistory className="text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Your recent commission earnings and bonuses</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAllTransactions(true)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          <FaEye />
          <span>View All</span>
        </button>
      </div>

      <div className="space-y-4">
        {transactions.slice(0, 3).map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                {getTransactionIcon(transaction.type)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">+{formatCurrency(transaction.amount)}</div>
            </div>
          </div>
        ))}
        
        {transactions.length === 0 && (
          <div className="text-center py-8">
            <FaRocket className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Your commission earnings will appear here</p>
          </div>
        )}
      </div>
    </div>
  );

if (loading) {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-500 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              {/* Ball Loading System */}
              <div className="flex justify-center space-x-2 mb-4">
                <div className="animate-bounce h-4 w-4 bg-blue-600 rounded-full [animation-delay:-0.3s]"></div>
                <div className="animate-bounce h-4 w-4 bg-blue-600 rounded-full [animation-delay:-0.15s]"></div>
                <div className="animate-bounce h-4 w-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-500 no-scrollbar flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {showAllTransactions ? (
              <TransactionsTable />
            ) : (
              <>
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Affiliate Dashboard
                      </h1>
                      <p className="text-gray-600 mt-2 flex items-center">
                        <span>Welcome back, </span>
                        <span className="font-semibold text-blue-600 ml-1">{profile.firstName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {mainStatsCards.map((card, index) => {
                    const IconComponent = card.icon;
                    const isPositive = card.trend > 0;
                    const hasTrend = card.trend !== 0;
                    
                    return (
                      <div 
                        key={index}
                        className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-gray-300 overflow-hidden"
                      >
                        {/* Gradient Background Effect */}
                        <div className={`absolute inset-0 border-[1px] border-gray-300 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        
                        {/* Animated Border */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          <div className="absolute inset-[1px] rounded-2xl bg-white"></div>
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatValue(card.value, card.format)}
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white shadow-lg`}>
                              <IconComponent className="text-xl" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {card.description}
                            </p>
                            {hasTrend && (
                              <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full border ${getTrendColor(card.trend)}`}>
                                {getTrendIcon(card.trend)}
                                <span>{Math.abs(card.trend)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* Commission Rates Summary */}
                <div className="mt-8 bg-white rounded-[10px] border border-gray-200/50 p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Commission Rates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 mb-1">Betting Commission</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {dashboardStats.commissionRate} %
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Revenue share from betting</p>
                        </div>
                        <FaBangladeshiTakaSign className="text-blue-500 text-xl" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Deposit Commission</p>
                          <p className="text-2xl font-bold text-green-900">
                            {dashboardStats.depositRate} %
                          </p>
                          <p className="text-xs text-green-600 mt-1">Commission on deposits</p>
                        </div>
                        <FaCreditCard className="text-green-500 text-xl" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600 mb-1">Registration Commission</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {dashboardStats.cpaRate} BDT
                          </p>
                          <p className="text-xs text-purple-600 mt-1">Per successful registration</p>
                        </div>
                        <FaPercentage className="text-purple-500 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Preview */}
                <RecentTransactionsPreview />
              </>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;
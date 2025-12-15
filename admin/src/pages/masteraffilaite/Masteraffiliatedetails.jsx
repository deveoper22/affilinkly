import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaUser, 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaUsers, 
  FaEye, 
  FaSpinner, 
  FaSearch, 
  FaSort,
  FaEdit,
  FaTrash,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBuilding,
  FaGlobe,
  FaIdCard,
  FaChartLine,
  FaPercentage,
  FaShieldAlt,
  FaHistory,
  FaArrowLeft,
  FaUserPlus,
  FaDownload,
  FaFilter,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyCheck,
  FaUserCheck,
  FaExchangeAlt
} from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Masteraffiliatedetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [masterAffiliate, setMasterAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedUserForClaim, setSelectedUserForClaim] = useState(null);
  const [claimStatus, setClaimStatus] = useState('unclaimed');
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    website: '',
    promoMethod: '',
    commissionRate: 0,
    commissionType: '',
    cpaRate: 0,
    depositRate: 0,
    status: '',
    verificationStatus: '',
    paymentMethod: '',
    minimumPayout: 0,
    payoutSchedule: '',
    autoPayout: false,
    notes: '',
    tags: [],
  });
  
  // For earnings history table
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [earningsSearchQuery, setEarningsSearchQuery] = useState('');
  const [earningsSortConfig, setEarningsSortConfig] = useState({ key: null, direction: 'asc' });
  const [earningsCurrentPage, setEarningsCurrentPage] = useState(1);
  const earningsItemsPerPage = 5;
  
  // For registered users table
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [usersSortConfig, setUsersSortConfig] = useState({ key: null, direction: 'asc' });
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const usersItemsPerPage = 5;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch master affiliate details
  const fetchMasterAffiliateDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${base_url}/api/admin/master-affiliate/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master affiliate details');
      }

      const data = await response.json();
      if (data.success) {
        setMasterAffiliate(data.data);
        // Extract earnings history from the data
        if (data.data.earningsHistory) {
          setEarningsHistory(data.data.earningsHistory);
        }
        // Extract registered users from the data
        if (data.data.registeredUsers) {
          setRegisteredUsers(data.data.registeredUsers);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch master affiliate details');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error fetching master affiliate details');
    } finally {
      setLoading(false);
    }
  };

  // Handle affiliate deletion
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete master affiliate');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Master affiliate deleted successfully');
        navigate('/admin/affiliates');
      } else {
        throw new Error(data.message || 'Failed to delete master affiliate');
      }
    } catch (err) {
      toast.error('Error deleting master affiliate');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Open edit modal
  const openEditModal = () => {
    if (masterAffiliate) {
      setEditForm({
        firstName: masterAffiliate.firstName || '',
        lastName: masterAffiliate.lastName || '',
        phone: masterAffiliate.phone || '',
        company: masterAffiliate.company || '',
        website: masterAffiliate.website || '',
        promoMethod: masterAffiliate.promoMethod || '',
        commissionRate: (masterAffiliate.commissionRate || 0) * 100,
        commissionType: masterAffiliate.commissionType || '',
        cpaRate: masterAffiliate.cpaRate || 0,
        depositRate: (masterAffiliate.depositRate || 0),
        status: masterAffiliate.status || '',
        verificationStatus: masterAffiliate.verificationStatus || '',
        paymentMethod: masterAffiliate.paymentMethod || '',
        minimumPayout: masterAffiliate.minimumPayout || 0,
        payoutSchedule: masterAffiliate.payoutSchedule || '',
        autoPayout: masterAffiliate.autoPayout || false,
        notes: masterAffiliate.notes || '',
        tags: masterAffiliate.tags || [],
      });
      setShowEditModal(true);
    }
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Handle tags input
  const handleTagsChange = (e) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setEditForm(prev => ({ ...prev, tags: tagsArray }));
  };

  // Submit edit form
  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...editForm,
        commissionRate: editForm.commissionRate / 100,
        depositRate: editForm.depositRate,
      };

      const response = await fetch(`${base_url}/api/affiliate/master-affiliate/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update master affiliate');
      }

      const data = await response.json();
      if (data.success) {
        setMasterAffiliate(data.data);
        toast.success('Master affiliate updated successfully');
        setShowEditModal(false);
        fetchMasterAffiliateDetails(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to update master affiliate');
      }
    } catch (err) {
      toast.error('Error updating master affiliate');
    }
  };

  // Open claim modal
  const openClaimModal = (user) => {
    setSelectedUserForClaim(user);
    setClaimStatus(user.claimedStatus || 'unclaimed');
    setShowClaimModal(true);
  };

  // Submit claim status change

const submitClaimStatus = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.put(
      `${base_url}/api/affiliate/chaged-stauts-to-claimed`,
      {
        masterAffiliateId: id,
        userId: selectedUserForClaim.userId,
        claimedStatus: claimStatus
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      }
    );
 console.log(id)
    if (response.data.success) {
      toast.success('Claim status updated successfully');
      setShowClaimModal(false);
      setClaimStatus('');
      setSelectedUserForClaim(null);
      fetchMasterAffiliateDetails();
    } else {
      throw new Error(response.data.message || 'Failed to update claim status');
    }
  } catch (err) {
    console.error('Update claim error:', err);
  }
};
  // Get claim status badge color
  const getClaimStatusColor = (status) => {
    switch (status) {
      case 'claimed': return 'bg-green-100 border-[1px] border-green-500 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-[1px] border-yellow-500';
      case 'unclaimed': return 'bg-gray-100 text-gray-800 border-[1px] border-gray-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'banned': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get verification status badge color
  const getVerificationColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'unverified': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'bkash': 'bKash',
      'nagad': 'Nagad',
      'rocket': 'Rocket',
      'binance': 'Binance',
      'bank_transfer': 'Bank Transfer'
    };
    return methods[method] || method;
  };

  // Get promo method display name
  const getPromoMethodDisplay = (method) => {
    return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Earnings History Functions
  const handleEarningsSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setEarningsSearchQuery(query);
    setEarningsCurrentPage(1);
    
    if (query === '') {
      if (masterAffiliate?.earningsHistory) {
        setEarningsHistory(masterAffiliate.earningsHistory);
      }
    } else {
      const filtered = (masterAffiliate?.earningsHistory || []).filter(
        (earning) =>
          earning.description?.toLowerCase().includes(query) ||
          earning.type?.toLowerCase().includes(query) ||
          earning.status?.toLowerCase().includes(query)
      );
      setEarningsHistory(filtered);
    }
  };

  const handleEarningsSort = (key) => {
    let direction = 'asc';
    if (earningsSortConfig.key === key && earningsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setEarningsSortConfig({ key, direction });

    const sorted = [...earningsHistory].sort((a, b) => {
      if (key === 'amount') {
        return direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (key === 'earnedAt') {
        return direction === 'asc'
          ? new Date(a.earnedAt) - new Date(b.earnedAt)
          : new Date(b.earnedAt) - new Date(a.earnedAt);
      } else if (key === 'description') {
        return direction === 'asc' 
          ? (a.description || '').localeCompare(b.description || '') 
          : (b.description || '').localeCompare(a.description || '');
      }
      return 0;
    });

    setEarningsHistory(sorted);
  };

  const getEarningsSortIcon = (key) => {
    if (earningsSortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return earningsSortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Registered Users Functions
  const handleUsersSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setUsersSearchQuery(query);
    setUsersCurrentPage(1);
    
    if (query === '') {
      if (masterAffiliate?.registeredUsers) {
        setRegisteredUsers(masterAffiliate.registeredUsers);
      }
    } else {
      const filtered = (masterAffiliate?.registeredUsers || []).filter(
        (user) =>
          user.userEmail?.toLowerCase().includes(query) ||
          user.userName?.toLowerCase().includes(query) ||
          (user.userId?.toString() || '').toLowerCase().includes(query)
      );
      setRegisteredUsers(filtered);
    }
  };

  const handleUsersSort = (key) => {
    let direction = 'asc';
    if (usersSortConfig.key === key && usersSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setUsersSortConfig({ key, direction });

    const sorted = [...registeredUsers].sort((a, b) => {
      if (key === 'registeredAt') {
        return direction === 'asc'
          ? new Date(a.registeredAt) - new Date(b.registeredAt)
          : new Date(b.registeredAt) - new Date(a.registeredAt);
      } else if (key === 'userEmail') {
        return direction === 'asc' 
          ? (a.userEmail || '').localeCompare(b.userEmail || '') 
          : (b.userEmail || '').localeCompare(a.userEmail || '');
      }
      return 0;
    });

    setRegisteredUsers(sorted);
  };

  const getUsersSortIcon = (key) => {
    if (usersSortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return usersSortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Pagination for earnings history
  const paginatedEarnings = useMemo(() => {
    const start = (earningsCurrentPage - 1) * earningsItemsPerPage;
    return earningsHistory.slice(start, start + earningsItemsPerPage);
  }, [earningsHistory, earningsCurrentPage]);

  const earningsTotalPages = Math.ceil(earningsHistory.length / earningsItemsPerPage);

  // Pagination for registered users
  const paginatedUsers = useMemo(() => {
    const start = (usersCurrentPage - 1) * usersItemsPerPage;
    return registeredUsers.slice(start, start + usersItemsPerPage);
  }, [registeredUsers, usersCurrentPage]);

  const usersTotalPages = Math.ceil(registeredUsers.length / usersItemsPerPage);

  // Available options for dropdowns
  const statuses = ['pending', 'active', 'suspended', 'banned', 'inactive'];
  const verificationStatuses = ['unverified', 'pending', 'verified', 'rejected'];
  const promoMethods = ['website', 'social_media', 'youtube', 'blog', 'email_marketing', 'other'];
  const commissionTypes = ['revenue_share', 'cpa', 'hybrid'];
  const paymentMethods = ['bkash', 'nagad', 'rocket', 'binance', 'bank_transfer'];
  const payoutSchedules = ['weekly', 'bi_weekly', 'monthly', 'manual'];
  const claimStatuses = ['unclaimed', 'pending', 'claimed'];

  useEffect(() => {
    if (id) {
      fetchMasterAffiliateDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-orange-500 text-4xl mr-3" />
              <span className="text-xl text-gray-600">Loading master affiliate details...</span>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Master Affiliate</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button 
                  onClick={fetchMasterAffiliateDetails}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Try Again
                </button>
                <Link 
                  to="/admin/affiliates"
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back to Affiliates
                </Link>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!masterAffiliate) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Master Affiliate Not Found</h2>
              <p className="text-gray-600 mb-6">The master affiliate you're looking for doesn't exist.</p>
              <Link 
                to="/admin/affiliates"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Back to Affiliates
              </Link>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Master Affiliate Details</h1>
                  <p className="text-gray-600 mt-1">Manage and view master affiliate information</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 font-medium text-lg ${
                  activeTab === 'overview'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`pb-3 px-1 font-medium text-lg ${
                  activeTab === 'earnings'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Earnings History
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-3 px-1 font-medium text-lg ${
                  activeTab === 'users'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registered Users ({masterAffiliate.totalRegisteredUsers || 0})
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Personal & Business Info */}
              <div className="xl:col-span-2 space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                      {masterAffiliate.firstName?.[0]}{masterAffiliate.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {masterAffiliate.firstName} {masterAffiliate.lastName}
                        <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Master Affiliate
                        </span>
                      </h2>
                      <p className="text-gray-600">{masterAffiliate.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center text-gray-700">
                        <FaEnvelope className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm">{masterAffiliate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaPhone className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-sm">{masterAffiliate.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaIdCard className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Master Code</p>
                          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{masterAffiliate.masterCode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center text-gray-700">
                        <FaShieldAlt className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(masterAffiliate.status)}`}>
                            {masterAffiliate.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaShieldAlt className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Verification</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationColor(masterAffiliate.verificationStatus)}`}>
                            {masterAffiliate.verificationStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <FaCalendar className="text-orange-500 mr-3" />
                        <div>
                          <p className="font-medium">Joined</p>
                          <p className="text-sm">{formatDate(masterAffiliate.createdAt)}</p>
                        </div>
                      </div>
                      {masterAffiliate.lastLogin && (
                        <div className="flex items-center text-gray-700">
                          <FaClock className="text-orange-500 mr-3" />
                          <div>
                            <p className="font-medium">Last Login</p>
                            <p className="text-sm">{formatDate(masterAffiliate.lastLogin)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaBuilding className="text-orange-500 mr-3" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <p className="text-gray-900">{masterAffiliate.company || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <p className="text-gray-900">
                          {masterAffiliate.website ? (
                            <a href={masterAffiliate.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                              {masterAffiliate.website}
                            </a>
                          ) : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Method</label>
                        <p className="text-gray-900 capitalize">
                          {getPromoMethodDisplay(masterAffiliate.promoMethod) || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900">
                          {masterAffiliate.address?.country || 'Bangladesh'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Source</label>
                        <p className="text-gray-900 capitalize">
                          {masterAffiliate.registrationSource?.replace('_', ' ') || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission & Payment Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaPercentage className="text-orange-500 mr-3" />
                    Commission & Payment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Commission Type</label>
                        <p className="text-gray-900 capitalize">
                          {masterAffiliate.commissionType?.replace('_', ' ') || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Bet Commission Rate</label>
                        <p className="text-gray-900">{((masterAffiliate.commissionRate || 0) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Deposit Commission Rate</label>
                        <p className="text-gray-900">{((masterAffiliate.depositRate || 0)).toFixed(1)}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Override Commission Rate</label>
                        <p className="text-gray-900">{((masterAffiliate.masterEarnings?.overrideCommission || 0)).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <p className="text-gray-900">
                          {getPaymentMethodDisplay(masterAffiliate.paymentMethod) || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout</label>
                        <p className="text-gray-900">{formatCurrency(masterAffiliate.minimumPayout || 0)} BDT</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payout Schedule</label>
                        <p className="text-gray-900 capitalize">
                          {masterAffiliate.payoutSchedule?.replace('_', ' ') || 'Manual'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Auto Payout</label>
                        <p className="text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            masterAffiliate.autoPayout ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {masterAffiliate.autoPayout ? 'Enabled' : 'Disabled'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  {masterAffiliate.paymentDetails && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(masterAffiliate.paymentDetails).map(([method, details]) => (
                          details && (
                            <div key={method} className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-semibold text-gray-700 mb-2 capitalize">{method}</h5>
                              {method === 'bkash' && details.phoneNumber && (
                                <p className="text-sm text-gray-600">Phone: {details.phoneNumber}</p>
                              )}
                              <p className="text-sm text-gray-600 capitalize">Type: {details.accountType || 'Personal'}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Stats & Performance */}
              <div className="space-y-6">
                {/* Earnings Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaMoneyBillWave className="text-orange-500 mr-3" />
                    Earnings Summary
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Earnings', value: formatCurrency(masterAffiliate.masterEarnings?.totalEarnings || 0), color: 'text-green-600' },
                      { label: 'Pending Earnings', value: formatCurrency(masterAffiliate.masterEarnings?.pendingEarnings || 0), color: 'text-yellow-600' },
                      { label: 'Paid Earnings', value: formatCurrency(masterAffiliate.masterEarnings?.paidEarnings || 0), color: 'text-blue-600' },
                      { label: 'Registration Earnings', value: formatCurrency(masterAffiliate.masterEarnings?.userRegistrationEarnings || 0), color: 'text-purple-600' },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaChartLine className="text-orange-500 mr-3" />
                    Performance
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Registered Users', value: masterAffiliate.totalRegisteredUsers || 0 },
                      { label: 'Total Sub Affiliates', value: masterAffiliate.totalSubAffiliates || 0 },
                      { label: 'Active Sub Affiliates', value: masterAffiliate.activeSubAffiliates || 0 },
                      { label: 'Conversion Rate', value: `${((masterAffiliate.conversionRate || 0) * 100).toFixed(1)}%` },
                      { label: 'Email Verified', value: masterAffiliate.emailVerified ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      ) },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Earnings History Tab */}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaHistory className="mr-3 text-orange-500" />
                Earnings History
                <span className="ml-3 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {earningsHistory.length} records
                </span>
              </h2>

              {earningsHistory.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {[
                            { label: 'Source Type', key: null },
                            { label: 'Amount (BDT)', key: 'amount' },
                            { label: 'Earned At', key: 'earnedAt' },
                          ].map((header, index) => (
                            <th
                              key={index}
                              className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                              onClick={header.key ? () => handleEarningsSort(header.key) : null}
                            >
                              <div className="flex items-center">
                                {header.label}
                                {header.key && (
                                  <span className="ml-1 text-orange-500">
                                    {getEarningsSortIcon(header.key)}
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEarnings.map((earning, index) => (
                          <tr key={earning._id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-6">
                              <span className="capitalize text-sm">
                                {earning.sourceType?.replace('_', ' ') || '-'}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-900">
                              {formatCurrency(earning.amount)}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {formatDate(earning.earnedAt)}
                            </td>
                        
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {earningsTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {paginatedEarnings.length} of {earningsHistory.length} earnings records
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEarningsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={earningsCurrentPage === 1}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Page {earningsCurrentPage} of {earningsTotalPages}
                        </span>
                        <button
                          onClick={() => setEarningsCurrentPage((prev) => Math.min(prev + 1, earningsTotalPages))}
                          disabled={earningsCurrentPage === earningsTotalPages}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FaMoneyBillWave className="mx-auto text-gray-300 text-5xl mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No earnings history found</p>
                  <p className="text-gray-400">
                    {earningsSearchQuery ? 'Try adjusting your search terms' : 'This master affiliate has no earnings history yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Registered Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaUserPlus className="mr-3 text-orange-500" />
                Registered Users
                <span className="ml-3 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {registeredUsers.length} users
                </span>
              </h2>

              {/* Search and Filter Section */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={usersSearchQuery}
                    onChange={handleUsersSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {registeredUsers.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {[
                            { label: 'User ID', key: null },
                            { label: 'Claim Status', key: null },
                            { label: 'Registered At', key: 'registeredAt' },
                          ].map((header, index) => (
                            <th
                              key={index}
                              className="py-4 px-6 text-left text-sm font-semibold text-gray-700"
                              onClick={header.key ? () => handleUsersSort(header.key) : null}
                            >
                              <div className="flex items-center">
                                {header.label}
                                {header.key && (
                                  <span className="ml-1 text-orange-500">
                                    {getUsersSortIcon(header.key)}
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user, index) => (
                          <tr key={user._id || index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="text-sm font-mono text-gray-900">
                                {user.userId}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                getClaimStatusColor(user.claimedStatus)
                              }`}>
                                {user.claimedStatus ? user.claimedStatus.charAt(0).toUpperCase() + user.claimedStatus.slice(1) : 'Unclaimed'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {formatDate(user.registeredAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {usersTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {paginatedUsers.length} of {registeredUsers.length} registered users
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setUsersCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={usersCurrentPage === 1}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Page {usersCurrentPage} of {usersTotalPages}
                        </span>
                        <button
                          onClick={() => setUsersCurrentPage((prev) => Math.min(prev + 1, usersTotalPages))}
                          disabled={usersCurrentPage === usersTotalPages}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FaUserPlus className="mx-auto text-gray-300 text-5xl mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No registered users found</p>
                  <p className="text-gray-400">
                    {usersSearchQuery ? 'Try adjusting your search terms' : 'This master affiliate has no registered users yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Master Affiliate</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {masterAffiliate?.firstName} {masterAffiliate?.lastName}? 
                This action cannot be undone and all associated data will be lost.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Master Affiliate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Edit Master Affiliate</h3>
              <p className="text-gray-600">Update master affiliate information and settings</p>
            </div>
            
            <form onSubmit={submitEdit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="text" 
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Business Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input 
                      type="text" 
                      name="company"
                      value={editForm.company}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input 
                      type="url" 
                      name="website"
                      value={editForm.website}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promo Method</label>
                    <select
                      name="promoMethod"
                      value={editForm.promoMethod}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Promo Method</option>
                      {promoMethods.map(method => (
                        <option key={method} value={method}>
                          {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Commission Settings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Commission Settings</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                    <input 
                      type="number" 
                      name="commissionRate"
                      value={editForm.commissionRate}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                    <select
                      name="commissionType"
                      value={editForm.commissionType}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Commission Type</option>
                      {commissionTypes.map(type => (
                        <option key={type} value={type}>
                          {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPA Rate (BDT)</label>
                    <input 
                      type="number" 
                      name="cpaRate"
                      value={editForm.cpaRate}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Rate (%)</label>
                    <input 
                      type="number" 
                      name="depositRate"
                      value={editForm.depositRate}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Status & Payment */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Status & Payment</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {statuses.map((status, index) => (
                        <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                    <select
                      name="verificationStatus"
                      value={editForm.verificationStatus}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {verificationStatuses.map((status, index) => (
                        <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={editForm.paymentMethod}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>
                          {getPaymentMethodDisplay(method)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout (BDT)</label>
                    <input 
                      type="number" 
                      name="minimumPayout"
                      value={editForm.minimumPayout}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Schedule</label>
                    <select
                      name="payoutSchedule"
                      value={editForm.payoutSchedule}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Payout Schedule</option>
                      {payoutSchedules.map(schedule => (
                        <option key={schedule} value={schedule}>
                          {schedule.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="autoPayout"
                      checked={editForm.autoPayout}
                      onChange={handleEditChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable Auto Payout</label>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Additional Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      name="tags"
                      value={editForm.tags.join(', ')}
                      onChange={handleTagsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 cursor-pointer bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Status Modal */}
      {showClaimModal && selectedUserForClaim && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Update Claim Status</h3>
              <p className="text-gray-600 mt-1">Change claim status for registered user</p>
            </div>
            
            <form onSubmit={submitClaimStatus} className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {selectedUserForClaim.userId?.toString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedUserForClaim.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getClaimStatusColor(selectedUserForClaim.claimedStatus)
                    }`}>
                      {selectedUserForClaim.claimedStatus ? selectedUserForClaim.claimedStatus.charAt(0).toUpperCase() + selectedUserForClaim.claimedStatus.slice(1) : 'Unclaimed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">New Claim Status *</label>
                <div className="space-y-2">
                  {claimStatuses.map((status) => (
                    <div key={status} className="flex items-center">
                      <input
                        type="radio"
                        id={`status-${status}`}
                        name="claimStatus"
                        value={status}
                        checked={claimStatus === status}
                        onChange={(e) => setClaimStatus(e.target.value)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                      />
                      <label 
                        htmlFor={`status-${status}`}
                        className="ml-3 block text-sm text-gray-900 capitalize"
                      >
                        {status}
                      </label>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        getClaimStatusColor(status)
                      }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  <span className="font-semibold">Unclaimed:</span> User hasn't been claimed yet<br />
                  <span className="font-semibold">Pending:</span> Claim request is pending approval<br />
                  <span className="font-semibold">Claimed:</span> User has been successfully claimed
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-6 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 cursor-pointer bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Masteraffiliatedetails;
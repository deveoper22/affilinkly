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
  FaArrowLeft
} from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const AffiliateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [masterAffiliates, setMasterAffiliates] = useState([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterAffiliatesLoading, setMasterAffiliatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const itemsPerPage = 5;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch affiliate details
  const fetchAffiliateDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedAffiliate(data.data);
        await fetchMasterAffiliates(id);
      } else {
        throw new Error(data.message || 'Failed to fetch affiliate details');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error fetching affiliate details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch master affiliates created by this super affiliate
  const fetchMasterAffiliates = async (superAffiliateId) => {
    try {
      setMasterAffiliatesLoading(true);
      const response = await axios.get(`${base_url}/api/admin/master-affiliates/${superAffiliateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setMasterAffiliates(response.data.data || []);
        setFilteredAffiliates(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch master affiliates');
      }
    } catch (error) {
      console.error('Error fetching master affiliates:', error);
      toast.error('Error fetching master affiliates');
      setMasterAffiliates([]);
      setFilteredAffiliates([]);
    } finally {
      setMasterAffiliatesLoading(false);
    }
  };

  // Handle affiliate deletion
  const handleDelete = () => {
    setAffiliateToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete affiliate');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Affiliate deleted successfully');
        navigate('/admin/affiliates');
      } else {
        throw new Error(data.message || 'Failed to delete affiliate');
      }
    } catch (err) {
      toast.error('Error deleting affiliate');
    } finally {
      setShowDeleteConfirm(false);
      setAffiliateToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAffiliateToDelete(null);
  };

  // Open edit modal
  const openEditModal = () => {
    if (selectedAffiliate) {
      setEditForm({
        firstName: selectedAffiliate.firstName || '',
        lastName: selectedAffiliate.lastName || '',
        phone: selectedAffiliate.phone || '',
        company: selectedAffiliate.company || '',
        website: selectedAffiliate.website || '',
        promoMethod: selectedAffiliate.promoMethod || '',
        commissionRate: (selectedAffiliate.commissionRate || 0) * 100,
        commissionType: selectedAffiliate.commissionType || '',
        cpaRate: selectedAffiliate.cpaRate || 0,
        depositRate: (selectedAffiliate.depositRate || 0) * 100,
        status: selectedAffiliate.status || '',
        verificationStatus: selectedAffiliate.verificationStatus || '',
        paymentMethod: selectedAffiliate.paymentMethod || '',
        minimumPayout: selectedAffiliate.minimumPayout || 0,
        payoutSchedule: selectedAffiliate.payoutSchedule || '',
        autoPayout: selectedAffiliate.autoPayout || false,
        notes: selectedAffiliate.notes || '',
        tags: selectedAffiliate.tags || [],
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
        depositRate: editForm.depositRate / 100,
      };

      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update affiliate');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedAffiliate(data.data);
        toast.success('Affiliate updated successfully');
        setShowEditModal(false);
      } else {
        throw new Error(data.message || 'Failed to update affiliate');
      }
    } catch (err) {
      toast.error('Error updating affiliate');
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

  // Handle view master affiliate details
  const handleViewMasterDetails = (masterId) => {
    navigate(`/admin/master-affiliates/${masterId}`);
  };

  // Search functionality
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);
    
    if (query === '') {
      setFilteredAffiliates(masterAffiliates);
    } else {
      const filtered = masterAffiliates.filter(
        (affiliate) =>
          `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase().includes(query) ||
          affiliate.email.toLowerCase().includes(query) ||
          affiliate.masterCode?.toLowerCase().includes(query)
      );
      setFilteredAffiliates(filtered);
    }
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredAffiliates].sort((a, b) => {
      if (key === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (key === 'email') {
        return direction === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
      } else if (key === 'totalEarnings') {
        const earningsA = a.masterEarnings?.totalEarnings || 0;
        const earningsB = b.masterEarnings?.totalEarnings || 0;
        return direction === 'asc' ? earningsA - earningsB : earningsB - earningsA;
      } else if (key === 'createdAt') {
        return direction === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setFilteredAffiliates(sorted);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Pagination
  const paginatedAffiliates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAffiliates.slice(start, start + itemsPerPage);
  }, [filteredAffiliates, currentPage]);

  const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage);

  // Available options for dropdowns
  const statuses = ['pending', 'active', 'suspended', 'banned', 'inactive'];
  const verificationStatuses = ['unverified', 'pending', 'verified', 'rejected'];
  const promoMethods = ['website', 'social_media', 'youtube', 'blog', 'email_marketing', 'other'];
  const commissionTypes = ['revenue_share', 'cpa', 'hybrid'];
  const paymentMethods = ['bkash', 'nagad', 'rocket', 'binance', 'bank_transfer'];
  const payoutSchedules = ['weekly', 'bi_weekly', 'monthly', 'manual'];

  useEffect(() => {
    if (id) {
      fetchAffiliateDetails();
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
              <span className="text-xl text-gray-600">Loading affiliate details...</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Affiliate</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button 
                  onClick={fetchAffiliateDetails}
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

  if (!selectedAffiliate) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Affiliate Not Found</h2>
              <p className="text-gray-600 mb-6">The affiliate you're looking for doesn't exist.</p>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Affiliate Details</h1>
                <p className="text-gray-600 mt-1">Manage and view affiliate information</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={openEditModal}
                  className="flex items-center px-4 cursor-pointer py-2 bg-blue-600 text-white rounded-[5px] hover:bg-blue-700 transition-colors"
                >
                  Edit Affiliate
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 cursor-pointer bg-red-600 text-white rounded-[5px] hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Personal & Business Info */}
            <div className="xl:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {selectedAffiliate.firstName?.[0]}{selectedAffiliate.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedAffiliate.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <FaEnvelope className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm">{selectedAffiliate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaPhone className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm">{selectedAffiliate.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaIdCard className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Affiliate Code</p>
                        <p className="text-sm font-mono">{selectedAffiliate.affiliateCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <FaShieldAlt className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Status</p>
                        <span className={`px-2 py-1 rounded-full border-[1px] border-${getStatusColor(selectedAffiliate.status)} text-xs font-medium ${getStatusColor(selectedAffiliate.status)}`}>
                          {selectedAffiliate.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaShieldAlt className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Verification</p>
                        <span className={`px-2 py-1 border-[1px] border-${getVerificationColor(selectedAffiliate.verificationStatus)} rounded-full text-xs font-medium ${getVerificationColor(selectedAffiliate.verificationStatus)}`}>
                          {selectedAffiliate.verificationStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaCalendar className="text-orange-500 mr-3" />
                      <div>
                        <p className="font-medium">Joined</p>
                        <p className="text-sm">{formatDate(selectedAffiliate.createdAt)}</p>
                      </div>
                    </div>
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
                      <p className="text-gray-900">{selectedAffiliate.company || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <p className="text-gray-900">
                        {selectedAffiliate.website ? (
                          <a href={selectedAffiliate.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                            {selectedAffiliate.website}
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Method</label>
                      <p className="text-gray-900 capitalize">
                        {selectedAffiliate.promoMethod?.replace('_', ' ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-gray-900">
                        {selectedAffiliate.address ? (
                          <>
                            {selectedAffiliate.address.street && <>{selectedAffiliate.address.street}, </>}
                            {selectedAffiliate.address.city && <>{selectedAffiliate.address.city}, </>}
                            {selectedAffiliate.address.state && <>{selectedAffiliate.address.state}, </>}
                            {selectedAffiliate.address.country || 'Bangladesh'}
                          </>
                        ) : 'Not provided'}
                      </p>
                    </div>
                    {selectedAffiliate.socialMediaProfiles && Object.keys(selectedAffiliate.socialMediaProfiles).some(key => selectedAffiliate.socialMediaProfiles[key]) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                        <div className="flex space-x-3">
                          {Object.entries(selectedAffiliate.socialMediaProfiles).map(([platform, url]) => 
                            url && (
                              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
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
                        {selectedAffiliate.commissionType?.replace('_', ' ') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Bet Commission Rate</label>
                      <p className="text-gray-900">{((selectedAffiliate.commissionRate || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Deposit Commission Rate</label>
                      <p className="text-gray-900">{((selectedAffiliate.depositRate || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Registration Commission</label>
                      <p className="text-gray-900">{formatCurrency(selectedAffiliate.cpaRate || 0)} BDT</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <p className="text-gray-900 capitalize">
                        {selectedAffiliate.paymentMethod?.replace('_', ' ') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout</label>
                      <p className="text-gray-900">{formatCurrency(selectedAffiliate.minimumPayout || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payout Schedule</label>
                      <p className="text-gray-900 capitalize">
                        {selectedAffiliate.payoutSchedule?.replace('_', ' ') || 'Manual'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auto Payout</label>
                      <p className="text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedAffiliate.autoPayout ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedAffiliate.autoPayout ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
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
                    { label: 'Total Earnings', value: formatCurrency(selectedAffiliate.totalEarnings), color: 'text-green-600' },
                    { label: 'Pending Earnings', value: formatCurrency(selectedAffiliate.pendingEarnings), color: 'text-yellow-600' },
                    { label: 'Paid Earnings', value: formatCurrency(selectedAffiliate.paidEarnings), color: 'text-blue-600' },
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
                    { label: 'Total Referrals', value: selectedAffiliate.referralCount || 0 },
                    { label: 'Active Referrals', value: selectedAffiliate.activeReferrals || 0 },
                    { label: 'Click Count', value: selectedAffiliate.clickCount || 0 },
                    { label: 'Conversion Rate', value: `${((selectedAffiliate.conversionRate || 0) * 100).toFixed(1)}%` },
                    { label: 'Avg Earning/Referral', value: formatCurrency(selectedAffiliate.averageEarningPerReferral || 0) },
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

          {/* Master Affiliates Section */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <FaUsers className="mr-3 text-orange-500" />
                Master Affiliates Created
                <span className="ml-3 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {masterAffiliates.length}
                </span>
              </h2>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search master affiliates..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {masterAffiliatesLoading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin text-orange-500 text-3xl mr-3" />
                <span className="text-gray-600">Loading master affiliates...</span>
              </div>
            ) : filteredAffiliates.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border-[1px] border-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {[
                          { label: 'Name', key: 'name' },
                          { label: 'Email', key: 'email' },
                          { label: 'Master Code', key: null },
                          { label: 'Total Earnings', key: 'totalEarnings' },
                          { label: 'Status', key: null },
                          { label: 'Created Date', key: 'createdAt' },
                        ].map((header, index) => (
                          <th
                            key={index}
                            className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                            onClick={header.key ? () => handleSort(header.key) : null}
                          >
                            <div className="flex items-center">
                              {header.label}
                              {header.key && (
                                <span className="ml-1 text-orange-500">
                                  {getSortIcon(header.key)}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAffiliates.map((master) => (
                        <tr key={master._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                {master.firstName?.[0]}{master.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {master.firstName} {master.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{master.email}</td>
                          <td className="py-4 px-6">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                              {master.masterCode}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-900">
                            {formatCurrency(master.masterEarnings?.totalEarnings || 0)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(master.status)}`}>
                              {master.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {formatDate(master.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {paginatedAffiliates.length} of {filteredAffiliates.length} master affiliates
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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
                <FaUsers className="mx-auto text-gray-300 text-5xl mb-4" />
                <p className="text-gray-500 text-lg mb-2">No master affiliates found</p>
                <p className="text-gray-400">
                  {searchQuery ? 'Try adjusting your search terms' : 'This affiliate has not created any master affiliates yet'}
                </p>
              </div>
            )}
          </div>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Affiliate</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedAffiliate?.firstName} {selectedAffiliate?.lastName}? 
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
                  Delete Affiliate
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
              <h3 className="text-2xl font-bold text-gray-900">Edit Affiliate</h3>
              <p className="text-gray-600">Update affiliate information and settings</p>
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
                          {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
    </section>
  );
};

export default AffiliateDetails;
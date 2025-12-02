import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaEye, FaPlus, FaSort, FaSortUp, FaSortDown, FaUser, FaPhone, FaEnvelope, FaMoneyBill, FaIdCard } from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FaSpinner } from 'react-icons/fa';

const Allaffiliate = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({ bet: 10, deposit: 0, registration: 0 });
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
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

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch affiliates from API
  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(verificationFilter !== 'all' && { verificationStatus: verificationFilter }),
          ...(searchTerm && { search: searchTerm }),
          sortBy: sortConfig.key || 'createdAt',
          sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
        });

        const response = await fetch(`${base_url}/api/admin/affiliates?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch affiliates');
        }

        const data = await response.json();
        if (data.success) {
          setAffiliates(data.data || []);
          setTotalPages(data.pagination?.total || 1);
          setTotalAffiliates(data.pagination?.totalRecords || 0);
        } else {
          throw new Error(data.message || 'Failed to fetch affiliates');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching affiliates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliates();
  }, [currentPage, statusFilter, verificationFilter, searchTerm, sortConfig]);

  const statuses = ['all', 'pending', 'active', 'suspended', 'banned', 'inactive'];
  const verificationStatuses = ['all', 'unverified', 'pending', 'verified', 'rejected'];
  const promoMethods = ['website', 'social_media', 'youtube', 'blog', 'email_marketing', 'other'];
  const commissionTypes = ['revenue_share', 'cpa', 'hybrid'];
  const paymentMethods = ['bkash', 'nagad', 'rocket', 'binance', 'bank_transfer'];
  const payoutSchedules = ['weekly', 'bi_weekly', 'monthly', 'manual'];

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-orange-500" />;
    return <FaSortDown className="text-orange-500" />;
  };

  // Handle affiliate deletion
  const handleDelete = (id) => {
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
        setAffiliates(affiliates.filter(affiliate => affiliate._id !== affiliateToDelete));
        setStatusToastMessage('Affiliate deleted successfully');
        setTotalAffiliates(prev => prev - 1);
      } else {
        throw new Error(data.message || 'Failed to delete affiliate');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error deleting affiliate');
    } finally {
      setShowDeleteConfirm(false);
      setAffiliateToDelete(null);
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAffiliateToDelete(null);
  };

  // Handle affiliate status update
  const updateAffiliateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update affiliate status');
      }

      const data = await response.json();
      if (data.success) {
        const updatedAffiliates = affiliates.map(affiliate => {
          if (affiliate._id === id) {
            return { ...affiliate, status: newStatus };
          }
          return affiliate;
        });

        setAffiliates(updatedAffiliates);
        setStatusToastMessage(`Affiliate status changed to ${newStatus}`);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating affiliate status');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle affiliate status toggle with commission setup for activation
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    if (newStatus === 'active') {
      const affiliate = affiliates.find(a => a._id === id);
      setSelectedAffiliateId(id);
      setCommissionForm({
        bet: ((affiliate.commissionRate || 0) * 100).toFixed(0) || 10,
        deposit: ((affiliate.depositRate || 0) * 100).toFixed(0) || 0,
        registration: affiliate.cpaRate || 0
      });
      setShowCommissionModal(true);
    } else {
      await updateAffiliateStatus(id, newStatus);
    }
  };

  // Handle commission form change
  const handleCommissionChange = (e) => {
    const { name, value } = e.target;
    setCommissionForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Submit commission and activate affiliate
  const submitCommissionAndActivate = async (e) => {
    e.preventDefault();
    try {
      // First update commission rates
      const commissionResponse = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          commissionRate: commissionForm.bet / 100,
          depositRate: commissionForm.deposit / 100,
          cpaRate: commissionForm.registration,
          commissionType: 'hybrid'
        })
      });

      if (!commissionResponse.ok) {
        throw new Error('Failed to update commissions');
      }

      const commissionData = await commissionResponse.json();
      if (!commissionData.success) {
        throw new Error(commissionData.message || 'Failed to update commissions');
      }

      // Then update status to active
      await updateAffiliateStatus(selectedAffiliateId, 'active');

      setShowCommissionModal(false);
      setSelectedAffiliateId(null);
    } catch (err) {
      setStatusToastMessage('Error activating affiliate with commissions');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle affiliate verification status update
  const updateVerificationStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ verificationStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      const data = await response.json();
      if (data.success) {
        const updatedAffiliates = affiliates.map(affiliate => {
          if (affiliate._id === id) {
            return { ...affiliate, verificationStatus: newStatus };
          }
          return affiliate;
        });

        setAffiliates(updatedAffiliates);
        setStatusToastMessage(`Verification status changed to ${newStatus}`);
      } else {
        throw new Error(data.message || 'Failed to update verification status');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating verification status');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle affiliate verification status toggle
  const toggleVerificationStatus = async (id, currentStatus) => {
    let newStatus;
    switch (currentStatus) {
      case 'verified': newStatus = 'rejected'; break;
      case 'rejected': newStatus = 'pending'; break;
      case 'pending': newStatus = 'unverified'; break;
      default: newStatus = 'verified';
    }
    await updateVerificationStatus(id, newStatus);
  };

  // View affiliate details
  const viewAffiliateDetails = async (affiliate) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
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
        setShowAffiliateDetails(true);
      } else {
        throw new Error(data.message || 'Failed to fetch affiliate details');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error fetching affiliate details');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Close affiliate details modal
  const closeAffiliateDetails = () => {
    setShowAffiliateDetails(false);
    setSelectedAffiliate(null);
  };

  // Open edit modal
  const openEditModal = async (affiliate) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate details for edit');
      }

      const data = await response.json();
      if (data.success) {
        const affiliateData = data.data;
        setEditForm({
          firstName: affiliateData.firstName || '',
          lastName: affiliateData.lastName || '',
          phone: affiliateData.phone || '',
          company: affiliateData.company || '',
          website: affiliateData.website || '',
          promoMethod: affiliateData.promoMethod || '',
          commissionRate: (affiliateData.commissionRate || 0) * 100,
          commissionType: affiliateData.commissionType || '',
          cpaRate: affiliateData.cpaRate || 0,
          depositRate: (affiliateData.depositRate || 0) * 100,
          status: affiliateData.status || '',
          verificationStatus: affiliateData.verificationStatus || '',
          paymentMethod: affiliateData.paymentMethod || '',
          minimumPayout: affiliateData.minimumPayout || 0,
          payoutSchedule: affiliateData.payoutSchedule || '',
          autoPayout: affiliateData.autoPayout || false,
          notes: affiliateData.notes || '',
          tags: affiliateData.tags || [],
        });
        setSelectedAffiliateId(affiliate._id);
        setShowEditModal(true);
      } else {
        throw new Error(data.message || 'Failed to fetch affiliate details');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error fetching affiliate details for edit');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
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

      const response = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}`, {
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
        setAffiliates(affiliates.map(a => a._id === selectedAffiliateId ? data.data : a));
        setStatusToastMessage('Affiliate updated successfully');
        setShowEditModal(false);
      } else {
        throw new Error(data.message || 'Failed to update affiliate');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating affiliate');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, verificationFilter]);

  if (loading) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="flex justify-center items-center py-8">
                <FaSpinner className="animate-spin text-orange-500 text-2xl" />
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-2xl mb-4">Error</div>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
                <p className="text-sm text-gray-500 mt-1">Oversee and manage all platform affiliates efficiently</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title: 'Total Affiliates', value: totalAffiliates, color: 'blue' },
                { title: 'Active Affiliates', value: affiliates.filter(a => a.status === 'active').length, color: 'green' },
                { title: 'Verified Affiliates', value: affiliates.filter(a => a.verificationStatus === 'verified').length, color: 'yellow' },
                { title: 'Pending Earnings', value: `${formatCurrency(affiliates.reduce((sum, a) => sum + (a.pendingEarnings || 0), 0))} BDT`, color: 'purple' },
              ].map((stat, index) => (
                <div key={index} className={`bg-white p-4 rounded-lg  border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setVerificationFilter('all');
                  }}
                  className="text-sm text-orange-500 hover:text-orange-700 flex items-center transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search name, email, or affiliate code..."
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statuses.map((status, index) => (
                    <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                {/* Verification Status Filter */}
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {verificationStatuses.map((status, index) => (
                    <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-gray-600">
              <p>
                Showing {affiliates.length} of {totalAffiliates} affiliates
              </p>
            </div>

            {/* Affiliates Table */}
            <div className="bg-white rounded-[5px] overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                    <tr className=''>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('affiliateCode')}>
                        <div className="flex items-center">
                          Affiliate Code
                          {getSortIcon('affiliateCode')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('pendingEarnings')}>
                        <div className="flex items-center">
                          Pending Earnings
                          {getSortIcon('pendingEarnings')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                        <div className="flex items-center">
                          Registered
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {affiliates.length > 0 ? (
                      affiliates.map((affiliate) => (
                        <tr key={affiliate._id} className="hover:bg-gray-50 text-nowrap transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                  <FaUser />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-[18px] font-semibold text-gray-900">{`${affiliate.firstName} ${affiliate.lastName}`}</div>
                                <div className="text-[sm] text-gray-500">{affiliate.company || 'No Company'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            <div className="text-sm text-gray-700 font-mono p-2 bg-green-100 border-[1px] border-green-400 text-center  rounded-[25px]">{affiliate.affiliateCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-[600] text-gray-700">{affiliate.email}</div>
                            <div className="text-base text-gray-500 flex items-center mt-1">
                              {affiliate.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[18px] font-bold text-gray-900">{formatCurrency(affiliate.pendingEarnings)} BDT</div>
                            {/* <div className="text-sm font-bold text-gray-500">Commission: {((affiliate.commissionRate || 0) * 100).toFixed(0)}%</div> */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={affiliate.status === 'active'}
                                onChange={() => toggleStatus(affiliate._id, affiliate.status)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              <span className="ml-3 text-sm font-bold text-gray-900 capitalize">
                                {affiliate.status}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            <div className="text-sm text-gray-700">{formatDate(affiliate.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <NavLink 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700 shadow-sm transition-colors duration-200"
                               to={`/affilaite/details/${affiliate._id}`}
                              >
                                <FaEye />
                              </NavLink>
                              {/* <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-orange-600 text-white rounded-[3px] text-[16px] hover:bg-orange-700 shadow-sm transition-colors duration-200"
                                title="Edit affiliate"
                                onClick={() => openEditModal(affiliate)}
                              >
                                <FaEdit />
                              </button> */}
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-red-600 text-white rounded-[3px] text-[16px] hover:bg-red-700 shadow-sm transition-colors duration-200"
                                onClick={() => handleDelete(affiliate._id)}
                                title="Delete affiliate"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaSearch className="text-5xl mb-3 opacity-30" />
                            <p className="text-lg font-medium text-gray-500">No affiliates found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {affiliates.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-[5px]  border border-gray-200">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalAffiliates)}
                      </span> of{' '}
                      <span className="font-medium">{totalAffiliates}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-800 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this affiliate? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Setup Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Commission Rates for Activation</h3>
            <form onSubmit={submitCommissionAndActivate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bet Commission (%)</label>
                  <input 
                    type="number" 
                    name="bet"
                    value={commissionForm.bet}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md  outline-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deposit Commission (%)</label>
                  <input 
                    type="number" 
                    name="deposit"
                    value={commissionForm.deposit}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md  outline-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Commission (BDT)</label>
                  <input 
                    type="number" 
                    name="registration"
                    value={commissionForm.registration}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none transition-colors duration-200"
                >
                  Activate with Commissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Affiliate</h3>
            <form onSubmit={submitEdit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 p-2 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    value={editForm.company}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>

                {/* Business Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input 
                    type="url" 
                    name="website"
                    value={editForm.website}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Promo Method</label>
                  <select
                    name="promoMethod"
                    value={editForm.promoMethod}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    <option value="">Select Promo Method</option>
                    {promoMethods.map(method => (
                      <option key={method} value={method}>
                        {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commission Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
                  <input 
                    type="number" 
                    name="commissionRate"
                    value={editForm.commissionRate}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission Type</label>
                  <select
                    name="commissionType"
                    value={editForm.commissionType}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700">CPA Rate (BDT)</label>
                  <input 
                    type="number" 
                    name="cpaRate"
                    value={editForm.cpaRate}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deposit Rate (%)</label>
                  <input 
                    type="number" 
                    name="depositRate"
                    value={editForm.depositRate}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {/* Status Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    {statuses.slice(1).map((status, index) => (
                      <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                  <select
                    name="verificationStatus"
                    value={editForm.verificationStatus}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    {verificationStatuses.slice(1).map((status, index) => (
                      <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={editForm.paymentMethod}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700">Minimum Payout (BDT)</label>
                  <input 
                    type="number" 
                    name="minimumPayout"
                    value={editForm.minimumPayout}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payout Schedule</label>
                  <select
                    name="payoutSchedule"
                    value={editForm.payoutSchedule}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
                  <label className="ml-2 block text-sm text-gray-900">Auto Payout</label>
                </div>

                {/* Additional Information */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    name="tags"
                    value={editForm.tags.join(', ')}
                    onChange={handleTagsChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea 
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Toast */}
      {showStatusToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {statusToastMessage}
        </div>
      )}

      {/* Affiliate Details Modal */}
      {showAffiliateDetails && selectedAffiliate && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">Affiliate Details</h3>
              <button onClick={closeAffiliateDetails} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-md">
                    <FaUser className="text-3xl" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900">{`${selectedAffiliate.firstName} ${selectedAffiliate.lastName}`}</h2>
                  <p className="text-sm text-gray-500 mb-4">Affiliate Code: {selectedAffiliate.affiliateCode}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <FaEnvelope className="text-gray-400 mr-2" />
                      {selectedAffiliate.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaPhone className="text-gray-400 mr-2" />
                      {selectedAffiliate.phone || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaIdCard className="text-gray-400 mr-2" />
                      <span className="capitalize">{selectedAffiliate.verificationStatus}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaMoneyBill className="text-gray-400 mr-2" />
                      {selectedAffiliate.commissionType} (Bet: {((selectedAffiliate.commissionRate || 0) * 100).toFixed(0)}%)
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Account Status</h4>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedAffiliate.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedAffiliate.status === 'pending'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedAffiliate.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedAffiliate.status}
                  </span>

                  <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Pending Earnings</h4>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedAffiliate.pendingEarnings)} BDT</p>
                  <p className="text-sm text-gray-600">CPA Rate: {selectedAffiliate.cpaRate || 0} BDT</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Financial Overview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="font-medium">{formatCurrency(selectedAffiliate.totalEarnings)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Referrals:</span>
                      <span className="font-medium">{selectedAffiliate.referredUsers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Click Count:</span>
                      <span className="font-medium">{selectedAffiliate.clickCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="font-medium">{((selectedAffiliate.conversionRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Rate:</span>
                      <span className="font-medium">{((selectedAffiliate.depositRate || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-medium">{formatDate(selectedAffiliate.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{selectedAffiliate.company || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website:</span>
                      <span className="font-medium">{selectedAffiliate.website || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promo Method:</span>
                      <span className="font-medium">{selectedAffiliate.promoMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedAffiliate.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Payout:</span>
                    <span className="font-medium">{formatCurrency(selectedAffiliate.minimumPayout)} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payout Schedule:</span>
                    <span className="font-medium">{selectedAffiliate.payoutSchedule || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto Payout:</span>
                    <span className="font-medium">{selectedAffiliate.autoPayout ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0">
              <button
                onClick={closeAffiliateDetails}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allaffiliate;
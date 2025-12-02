import React, { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaPlus, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMoneyBill, 
  FaIdCard,
  FaUsers,
  FaChartLine,
  FaCreditCard,
  FaPercentage,
  FaNetworkWired
} from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { FaSpinner } from 'react-icons/fa';

const Masteraffiliate = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [masterToDelete, setMasterToDelete] = useState(null);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState('');
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [showMasterDetails, setShowMasterDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [masterAffiliates, setMasterAffiliates] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMasters, setTotalMasters] = useState(0);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({ 
    bet: 5, 
    deposit: 0, 
    overrideCommission: 5 
  });
  const [selectedMasterId, setSelectedMasterId] = useState(null);
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
    overrideCommission: 5,
    status: '',
    verificationStatus: '',
    paymentMethod: '',
    minimumPayout: 0,
    payoutSchedule: '',
    autoPayout: false,
    notes: '',
    tags: [],
  });
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [subAffiliateForm, setSubAffiliateForm] = useState({
    affiliateCode: '',
    customCommissionRate: null,
    customDepositRate: null
  });
  const [selectedMasterForSub, setSelectedMasterForSub] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    transactionId: '',
    notes: ''
  });

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch master affiliates from API
  useEffect(() => {
    const fetchMasterAffiliates = async () => {
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

        const response = await fetch(`${base_url}/api/admin/master-affiliates?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        console.log(response)
        if (!response.ok) {
          throw new Error('Failed to fetch master affiliates');
        }

        const data = await response.json();
        if (data.success) {
          setMasterAffiliates(data.data || []);
          setTotalPages(data.pagination?.total || 1);
          setTotalMasters(data.pagination?.totalRecords || 0);
        } else {
          throw new Error(data.message || 'Failed to fetch master affiliates');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching master affiliates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterAffiliates();
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

  // Handle master affiliate deletion
  const handleDelete = (id) => {
    setMasterToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${masterToDelete}`, {
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
        setMasterAffiliates(masterAffiliates.filter(master => master._id !== masterToDelete));
        setStatusToastMessage('Master affiliate deleted successfully');
        setTotalMasters(prev => prev - 1);
      } else {
        throw new Error(data.message || 'Failed to delete master affiliate');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error deleting master affiliate');
    } finally {
      setShowDeleteConfirm(false);
      setMasterToDelete(null);
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMasterToDelete(null);
  };

  // Handle master affiliate status update
  const updateMasterStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update master affiliate status');
      }

      const data = await response.json();
      if (data.success) {
        const updatedMasters = masterAffiliates.map(master => {
          if (master._id === id) {
            return { ...master, status: newStatus };
          }
          return master;
        });

        setMasterAffiliates(updatedMasters);
        setStatusToastMessage(`Master affiliate status changed to ${newStatus}`);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating master affiliate status');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle master affiliate status toggle
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateMasterStatus(id, newStatus);
  };

  // Handle commission form change
  const handleCommissionChange = (e) => {
    const { name, value } = e.target;
    setCommissionForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Update master affiliate commission rates
  const updateMasterCommission = async (masterId, commissionData) => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${masterId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(commissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to update commission rates');
      }

      const data = await response.json();
      if (data.success) {
        setStatusToastMessage('Commission rates updated successfully');
        // Refresh the list
        const updatedMasters = masterAffiliates.map(master => {
          if (master._id === masterId) {
            return { ...master, ...commissionData };
          }
          return master;
        });
        setMasterAffiliates(updatedMasters);
      } else {
        throw new Error(data.message || 'Failed to update commission rates');
      }
    } catch (err) {
      setStatusToastMessage('Error updating commission rates');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle master affiliate verification status update
  const updateVerificationStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${id}`, {
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
        const updatedMasters = masterAffiliates.map(master => {
          if (master._id === id) {
            return { ...master, verificationStatus: newStatus };
          }
          return master;
        });

        setMasterAffiliates(updatedMasters);
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

  // Handle master affiliate verification status toggle
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

  // View master affiliate details
  const viewMasterDetails = async (master) => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${master._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master affiliate details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedMaster(data.data);
        setShowMasterDetails(true);
      } else {
        throw new Error(data.message || 'Failed to fetch master affiliate details');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error fetching master affiliate details');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Close master affiliate details modal
  const closeMasterDetails = () => {
    setShowMasterDetails(false);
    setSelectedMaster(null);
  };

  // Open edit modal
  const openEditModal = async (master) => {
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${master._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master affiliate details for edit');
      }

      const data = await response.json();
      if (data.success) {
        const masterData = data.data;
        setEditForm({
          firstName: masterData.firstName || '',
          lastName: masterData.lastName || '',
          phone: masterData.phone || '',
          company: masterData.company || '',
          website: masterData.website || '',
          promoMethod: masterData.promoMethod || '',
          commissionRate: (masterData.commissionRate || 0) * 100,
          commissionType: masterData.commissionType || '',
          cpaRate: masterData.cpaRate || 0,
          depositRate: (masterData.depositRate || 0) * 100,
          overrideCommission: masterData.masterEarnings?.overrideCommission || 5,
          status: masterData.status || '',
          verificationStatus: masterData.verificationStatus || '',
          paymentMethod: masterData.paymentMethod || '',
          minimumPayout: masterData.minimumPayout || 0,
          payoutSchedule: masterData.payoutSchedule || '',
          autoPayout: masterData.autoPayout || false,
          notes: masterData.notes || '',
          tags: masterData.tags || [],
        });
        setSelectedMasterId(master._id);
        setShowEditModal(true);
      } else {
        throw new Error(data.message || 'Failed to fetch master affiliate details');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error fetching master affiliate details for edit');
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

      const response = await fetch(`${base_url}/api/admin/master-affiliates/${selectedMasterId}`, {
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
        setMasterAffiliates(masterAffiliates.map(m => m._id === selectedMasterId ? data.data : m));
        setStatusToastMessage('Master affiliate updated successfully');
        setShowEditModal(false);
      } else {
        throw new Error(data.message || 'Failed to update master affiliate');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating master affiliate');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Open add sub-affiliate modal
  const openAddSubModal = (masterId) => {
    setSelectedMasterForSub(masterId);
    setSubAffiliateForm({
      affiliateCode: '',
      customCommissionRate: null,
      customDepositRate: null
    });
    setShowAddSubModal(true);
  };

  // Handle sub-affiliate form change
  const handleSubAffiliateChange = (e) => {
    const { name, value } = e.target;
    setSubAffiliateForm(prev => ({ 
      ...prev, 
      [name]: value === '' ? null : parseFloat(value) 
    }));
  };

  // Add sub-affiliate
  const addSubAffiliate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${selectedMasterForSub}/sub-affiliates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          affiliateId: subAffiliateForm.affiliateCode,
          customCommissionRate: subAffiliateForm.customCommissionRate,
          customDepositRate: subAffiliateForm.customDepositRate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add sub-affiliate');
      }

      const data = await response.json();
      if (data.success) {
        setStatusToastMessage('Sub-affiliate added successfully');
        setShowAddSubModal(false);
        // Refresh master affiliate details
        const master = masterAffiliates.find(m => m._id === selectedMasterForSub);
        if (master) {
          viewMasterDetails(master);
        }
      } else {
        throw new Error(data.message || 'Failed to add sub-affiliate');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error adding sub-affiliate');
    } finally {
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Open payout modal
  const openPayoutModal = (master) => {
    setSelectedMasterId(master._id);
    setPayoutForm({
      amount: master.masterEarnings?.pendingEarnings || 0,
      transactionId: '',
      notes: ''
    });
    setShowPayoutModal(true);
  };

  // Handle payout form change
  const handlePayoutChange = (e) => {
    const { name, value } = e.target;
    setPayoutForm(prev => ({ ...prev, [name]: value }));
  };

  // Process payout
  const processPayout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${base_url}/api/admin/master-affiliates/${selectedMasterId}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(payoutForm)
      });

      if (!response.ok) {
        throw new Error('Failed to process payout');
      }

      const data = await response.json();
      if (data.success) {
        setStatusToastMessage('Payout processed successfully');
        setShowPayoutModal(false);
        // Refresh the list
        const updatedMasters = masterAffiliates.map(master => {
          if (master._id === selectedMasterId) {
            return {
              ...master,
              masterEarnings: {
                ...master.masterEarnings,
                pendingEarnings: master.masterEarnings.pendingEarnings - parseFloat(payoutForm.amount),
                paidEarnings: master.masterEarnings.paidEarnings + parseFloat(payoutForm.amount)
              }
            };
          }
          return master;
        });
        setMasterAffiliates(updatedMasters);
      } else {
        throw new Error(data.message || 'Failed to process payout');
      }
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error processing payout');
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
                <h1 className="text-2xl font-bold text-gray-900">Master Affiliate Management</h1>
                <p className="text-sm text-gray-500 mt-1">Oversee and manage all master affiliates and their networks</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { 
                  title: 'Total Masters', 
                  value: totalMasters, 
                  icon: <FaUser className="text-blue-500" />,
                  color: 'blue'
                },
                { 
                  title: 'Active Masters', 
                  value: masterAffiliates.filter(m => m.status === 'active').length, 
                  icon: <FaUsers className="text-green-500" />,
                  color: 'green'
                },
                { 
                  title: 'Total Earnings', 
                  value: `${formatCurrency(masterAffiliates.reduce((sum, m) => sum + (m.masterEarnings?.totalEarnings || 0), 0))} BDT`, 
                  icon: <FaMoneyBill className="text-yellow-500" />,
                  color: 'yellow'
                },
                { 
                  title: 'Pending Payouts', 
                  value: `${formatCurrency(masterAffiliates.reduce((sum, m) => sum + (m.masterEarnings?.pendingEarnings || 0), 0))} BDT`, 
                  icon: <FaCreditCard className="text-purple-500" />,
                  color: 'purple'
                },
              ].map((stat, index) => (
                <div key={index} className={`bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                    <div className="text-xl">
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
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
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center transition-colors duration-200"
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
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search name, email, or master code..."
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map((status, index) => (
                    <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                {/* Verification Status Filter */}
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Showing {masterAffiliates.length} of {totalMasters} master affiliates
              </p>
            </div>

            {/* Master Affiliates Table */}
            <div className="bg-white rounded-[5px] overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Master Affiliate
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('masterCode')}>
                        <div className="flex items-center">
                          Master Code
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Network Stats
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('masterEarnings.pendingEarnings')}>
                        <div className="flex items-center">
                          Earnings
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                        <div className="flex items-center">
                          Registered
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {masterAffiliates.length > 0 ? (
                      masterAffiliates.map((master) => (
                        <tr key={master._id} className="hover:bg-gray-50 text-nowrap transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white">
                                  <FaUser size={20} />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-[18px] font-semibold text-gray-900">{`${master.firstName} ${master.lastName}`}</div>
                                <div className="text-[sm] text-gray-500">{master.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            <div className="text-sm text-gray-700 font-mono p-2 bg-purple-100 border-[1px] border-purple-400 text-center rounded-[25px]">
                              {master.masterCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <FaUsers className="text-gray-400 mr-2" />
                                <span className="font-bold text-gray-900">{master.totalSubAffiliates || 0}</span>
                                <span className="text-gray-500 ml-1">Sub-affiliates</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <FaPercentage className="text-gray-400 mr-2" />
                                <span className="font-bold text-gray-900">{master.masterEarnings?.overrideCommission || 5}%</span>
                                <span className="text-gray-500 ml-1">Override</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(master.masterEarnings?.pendingEarnings || 0)} BDT
                              </div>
                              <div className="text-sm text-gray-500">
                                Total: {formatCurrency(master.masterEarnings?.totalEarnings || 0)} BDT
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={master.status === 'active'}
                                  onChange={() => toggleStatus(master._id, master.status)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                <span className="ml-3 text-sm font-bold text-gray-900 capitalize">
                                  {master.status}
                                </span>
                              </label>
                              <div className="text-xs">
                                <button
                                  onClick={() => toggleVerificationStatus(master._id, master.verificationStatus)}
                                  className={`px-2 py-1 rounded capitalize ${
                                    master.verificationStatus === 'verified' 
                                      ? 'bg-green-100 text-green-800' 
                                      : master.verificationStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : master.verificationStatus === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {master.verificationStatus}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold">
                            <div className="text-sm text-gray-700">{formatDate(master.createdAt)}</div>
                            {master.createdBy && (
                              <div className="text-xs text-gray-500">By: {master.createdByRole}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-purple-600 text-white rounded-[3px] text-[16px] hover:bg-purple-700 shadow-sm transition-colors duration-200"
                                title="View details"
                                onClick={() => viewMasterDetails(master)}
                              >
                                <FaEye />
                              </button>
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700 shadow-sm transition-colors duration-200"
                                title="Edit master"
                                onClick={() => openEditModal(master)}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-green-600 text-white rounded-[3px] text-[16px] hover:bg-green-700 shadow-sm transition-colors duration-200"
                                title="Add sub-affiliate"
                                onClick={() => openAddSubModal(master._id)}
                              >
                                <FaNetworkWired />
                              </button>
                              {master.masterEarnings?.pendingEarnings > 0 && (
                                <button 
                                  className="p-2 px-[8px] py-[7px] cursor-pointer bg-yellow-600 text-white rounded-[3px] text-[16px] hover:bg-yellow-700 shadow-sm transition-colors duration-200"
                                  title="Process payout"
                                  onClick={() => openPayoutModal(master)}
                                >
                                  <FaMoneyBill />
                                </button>
                              )}
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-red-600 text-white rounded-[3px] text-[16px] hover:bg-red-700 shadow-sm transition-colors duration-200"
                                onClick={() => handleDelete(master._id)}
                                title="Delete master"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaUsers className="text-5xl mb-3 opacity-30" />
                            <p className="text-lg font-medium text-gray-500">No master affiliates found</p>
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
            {masterAffiliates.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-[5px] border border-gray-200">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalMasters)}
                      </span> of{' '}
                      <span className="font-medium">{totalMasters}</span> results
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
                              ? 'z-10 bg-purple-500 text-white'
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
              Are you sure you want to delete this master affiliate? This will also remove all associated sub-affiliate relationships. This action cannot be undone.
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

      {/* Commission Update Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Commission Rates</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMasterCommission(selectedMasterId, {
                commissionRate: commissionForm.bet / 100,
                depositRate: commissionForm.deposit / 100,
                overrideCommission: commissionForm.overrideCommission
              });
              setShowCommissionModal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bet Commission (%)</label>
                  <input 
                    type="number" 
                    name="bet"
                    value={commissionForm.bet}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="1"
                    max="50"
                    step="0.1"
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
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="0"
                    max="50"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Override Commission (%)</label>
                  <input 
                    type="number" 
                    name="overrideCommission"
                    value={commissionForm.overrideCommission}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
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
                  className="px-4 py-2 bg-purple-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                >
                  Update Commissions
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Master Affiliate</h3>
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 p-2 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    value={editForm.company}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Promo Method</label>
                  <select
                    name="promoMethod"
                    value={editForm.promoMethod}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {/* Master-Specific Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Override Commission (%)</label>
                  <input 
                    type="number" 
                    name="overrideCommission"
                    value={editForm.overrideCommission}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Affiliate Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Sub-Affiliate</h3>
            <form onSubmit={addSubAffiliate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Affiliate Code</label>
                  <input 
                    type="text" 
                    name="affiliateCode"
                    value={subAffiliateForm.affiliateCode}
                    onChange={handleSubAffiliateChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    placeholder="Enter affiliate code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom Commission Rate (%) (Optional)</label>
                  <input 
                    type="number" 
                    name="customCommissionRate"
                    value={subAffiliateForm.customCommissionRate || ''}
                    onChange={handleSubAffiliateChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom Deposit Rate (%) (Optional)</label>
                  <input 
                    type="number" 
                    name="customDepositRate"
                    value={subAffiliateForm.customDepositRate || ''}
                    onChange={handleSubAffiliateChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                >
                  Add Sub-Affiliate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Payout</h3>
            <form onSubmit={processPayout}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (BDT)</label>
                  <input 
                    type="number" 
                    name="amount"
                    value={payoutForm.amount}
                    onChange={handlePayoutChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID (Optional)</label>
                  <input 
                    type="text" 
                    name="transactionId"
                    value={payoutForm.transactionId}
                    onChange={handlePayoutChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    placeholder="Enter transaction ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    value={payoutForm.notes}
                    onChange={handlePayoutChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md outline-purple-500 sm:text-sm"
                    placeholder="Add any notes about this payout"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                >
                  Process Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Affiliate Details Modal */}
      {showMasterDetails && selectedMaster && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Master Affiliate Details</h3>
                <span className="ml-4 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-400 to-purple-600 text-white">
                  {selectedMaster.masterCode}
                </span>
              </div>
              <button onClick={closeMasterDetails} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <FaUser className="text-3xl" />
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{`${selectedMaster.firstName} ${selectedMaster.lastName}`}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedMaster.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedMaster.status === 'pending'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedMaster.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedMaster.status}
                        </span>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedMaster.verificationStatus === 'verified' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedMaster.verificationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedMaster.verificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedMaster.verificationStatus}
                        </span>
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Master Affiliate
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(selectedMaster.masterEarnings?.totalEarnings || 0)} BDT
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <FaEnvelope className="text-gray-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{selectedMaster.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaPhone className="text-gray-400 mr-2 flex-shrink-0" />
                      {selectedMaster.phone || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaUsers className="text-gray-400 mr-2 flex-shrink-0" />
                      {selectedMaster.totalSubAffiliates || 0} Sub-affiliates
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <FaPercentage className="text-gray-400 mr-2 flex-shrink-0" />
                      {selectedMaster.masterEarnings?.overrideCommission || 5}% Override
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm border border-purple-200">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                      <FaMoneyBill className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Pending Earnings</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedMaster.masterEarnings?.pendingEarnings || 0)} BDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                      <FaMoneyBill className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Paid Earnings</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedMaster.masterEarnings?.paidEarnings || 0)} BDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                      <FaUsers className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Active Sub-Affiliates</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMaster.activeSubAffiliates || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg shadow-sm border border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                      <FaChartLine className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg. Per Sub</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMaster.totalSubAffiliates > 0 
                          ? formatCurrency((selectedMaster.masterEarnings?.totalEarnings || 0) / selectedMaster.totalSubAffiliates)
                          : '0'} BDT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Personal & Business Information */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">
                    Personal & Business Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span className="font-medium">{selectedMaster.firstName} {selectedMaster.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{selectedMaster.company || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website:</span>
                      <span className="font-medium">{selectedMaster.website || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promo Method:</span>
                      <span className="font-medium">
                        {selectedMaster.promoMethod ? 
                          selectedMaster.promoMethod.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">
                        {selectedMaster.createdByRole || 'N/A'}
                        {selectedMaster.createdBy?.firstName && (
                          <span className="ml-2">
                            ({selectedMaster.createdBy.firstName} {selectedMaster.createdBy.lastName})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-medium">{formatDate(selectedMaster.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Commission & Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">
                    Commission & Payment Settings
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bet Commission:</span>
                      <span className="font-medium">{((selectedMaster.commissionRate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Commission:</span>
                      <span className="font-medium">{((selectedMaster.depositRate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPA Rate:</span>
                      <span className="font-medium">{formatCurrency(selectedMaster.cpaRate || 0)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Type:</span>
                      <span className="font-medium">
                        {selectedMaster.commissionType ? 
                          selectedMaster.commissionType.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">
                        {selectedMaster.paymentMethod ? 
                          selectedMaster.paymentMethod.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Payout:</span>
                      <span className="font-medium">{formatCurrency(selectedMaster.minimumPayout || 0)} BDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Affiliates Section */}
              {selectedMaster.subAffiliates && selectedMaster.subAffiliates.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-8">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Sub-Affiliates ({selectedMaster.subAffiliates.length})</h4>
                    <button 
                      onClick={() => openAddSubModal(selectedMaster._id)}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      Add Sub-Affiliate
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedMaster.subAffiliates.slice(0, 5).map((sub, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {sub.affiliate?.firstName} {sub.affiliate?.lastName}
                              {sub.affiliate?.email && (
                                <div className="text-xs text-gray-500">{sub.affiliate.email}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sub.joinedAt)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                              {formatCurrency(sub.totalEarned || 0)} BDT
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                sub.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : sub.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedMaster.subAffiliates.length > 5 && (
                      <div className="text-center mt-3">
                        <button className="text-xs text-purple-600 hover:text-purple-800">
                          View all {selectedMaster.subAffiliates.length} sub-affiliates →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Earnings History */}
              {selectedMaster.earningsHistory && selectedMaster.earningsHistory.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">
                    Recent Earnings
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedMaster.earningsHistory.slice(0, 5).map((earning, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(earning.earnedAt)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                earning.type === 'override_commission' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : earning.type === 'bonus'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {earning.type.replace('_', ' ').charAt(0).toUpperCase() + earning.type.replace('_', ' ').slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                              {formatCurrency(earning.amount)} BDT
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {earning.sourceAffiliate?.firstName || 'Unknown'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                earning.status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : earning.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {earning.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedMaster.earningsHistory.length > 5 && (
                      <div className="text-center mt-3">
                        <button className="text-xs text-purple-600 hover:text-purple-800">
                          View all {selectedMaster.earningsHistory.length} earnings →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between sticky bottom-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => openEditModal(selectedMaster)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                >
                  Edit Master
                </button>
                {selectedMaster.masterEarnings?.pendingEarnings > 0 && (
                  <button
                    onClick={() => openPayoutModal(selectedMaster)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none transition-colors duration-200"
                  >
                    Process Payout
                  </button>
                )}
              </div>
              <button
                onClick={closeMasterDetails}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Toast */}
      {showStatusToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {statusToastMessage}
        </div>
      )}
    </section>
  );
};

export default Masteraffiliate;
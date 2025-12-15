import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaCheckCircle,
  FaTimesCircle,
  FaFileExport,
  FaSync,
  FaUsers,
  FaPercentage,
  FaUser,
  FaCalendar,
  FaChartBar,
  FaIdCard,
  FaTag,
  FaCheck,
  FaTimes,
  FaClock,
  FaHourglassHalf,
  FaExclamationTriangle
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Registrationhistory = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    claimedUsers: 0,
    unclaimedUsers: 0,
    pendingUsers: 0,
    claimRate: '0%'
  });
  const [updatingClaim, setUpdatingClaim] = useState({});

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load registered users data
  useEffect(() => {
    loadRegisteredUsers();
  }, [currentPage]);

  const loadRegisteredUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('masterAffiliateToken');
      
      const response = await axios.get(`${base_url}/api/master-affiliate/registered-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const usersData = response.data.users || [];
        
        // Process users data - ensure we have proper claimedStatus
        const processedUsers = usersData.map(user => {
          // Handle different possible status values
          let claimedStatus = user.claimedStatus || 'unclaimed';
          
          // If claimed is a boolean, convert to proper status
          if (user.claimed === true) {
            claimedStatus = 'claimed';
          } else if (user.claimed === false) {
            claimedStatus = 'unclaimed';
          }
          
          return {
            ...user,
            claimedStatus,
            // Ensure userId is properly set
            userId: user.userId?._id || user.userId || user._id
          };
        });
        
        setUsers(processedUsers);
        
        // Calculate stats from users data
        const total = processedUsers.length;
        const claimed = processedUsers.filter(user => user.claimedStatus === 'claimed').length;
        const pending = processedUsers.filter(user => user.claimedStatus === 'pending').length;
        const unclaimed = processedUsers.filter(user => user.claimedStatus === 'unclaimed').length;
        const claimRate = total > 0 ? ((claimed / total) * 100).toFixed(2) + '%' : '0%';
        
        setStats({
          totalUsers: total,
          claimedUsers: claimed,
          pendingUsers: pending,
          unclaimedUsers: unclaimed,
          claimRate: claimRate
        });
      }
    } catch (error) {
      console.error('Error loading registered users:', error);
      toast.error('Failed to load registered users data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClaimStatus = async (userId, status) => {
    try {
      // Find the current user to check status
      const currentUser = users.find(user => user.userId === userId || user.userId?._id === userId);
      
      if (!currentUser) {
        toast.error('User not found');
        return;
      }

      // Check if trying to change a claimed user
      if (currentUser.claimedStatus === 'claimed') {
        toast.error('Cannot change status of already claimed users');
        return;
      }

      setUpdatingClaim(prev => ({ ...prev, [userId]: true }));
      const token = localStorage.getItem('masterAffiliateToken');
      
      const response = await axios.post(
        `${base_url}/api/master-affiliate/update-claim`,
        { 
          userId: currentUser.userId?._id || currentUser.userId, 
          status 
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Update response:', response.data);

      if (response.data.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.userId === userId || user.userId?._id === userId) {
              const updatedUser = {
                ...user,
                claimedStatus: status,
                // Update timestamps
                claimedRequestAt: status === 'pending' ? new Date().toISOString() : null,
                claimedAt: status === 'claimed' ? new Date().toISOString() : null
              };
              
              return updatedUser;
            }
            return user;
          })
        );

        // Update stats
        setStats(prevStats => {
          let newClaimedUsers = prevStats.claimedUsers;
          let newPendingUsers = prevStats.pendingUsers;
          let newUnclaimedUsers = prevStats.unclaimedUsers;

          const currentStatus = currentUser.claimedStatus;
          
          // Remove from old status
          if (currentStatus === 'claimed') newClaimedUsers--;
          else if (currentStatus === 'pending') newPendingUsers--;
          else if (currentStatus === 'unclaimed') newUnclaimedUsers--;
          
          // Add to new status
          if (status === 'claimed') newClaimedUsers++;
          else if (status === 'pending') newPendingUsers++;
          else if (status === 'unclaimed') newUnclaimedUsers++;

          const newClaimRate = prevStats.totalUsers > 0 
            ? ((newClaimedUsers / prevStats.totalUsers) * 100).toFixed(2) + '%' 
            : '0%';
          
          return {
            ...prevStats,
            claimedUsers: newClaimedUsers,
            pendingUsers: newPendingUsers,
            unclaimedUsers: newUnclaimedUsers,
            claimRate: newClaimRate
          };
        });

        toast.success(response.data.message || `Status updated to ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update claim status');
      }
    } finally {
      setUpdatingClaim(prev => ({ ...prev, [userId]: false }));
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

  const getClaimStatusBadge = (status) => {
    switch(status) {
      case 'claimed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 border-[1px] border-green-500 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheck className="w-3 h-3 mr-1" />
            Claimed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 border-[1px] border-blue-500 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaClock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'unclaimed':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 border-[1px] border-yellow-500 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaTimes className="w-3 h-3 mr-1" />
            Unclaimed
          </span>
        );
    }
  };

  const refreshData = () => {
    loadRegisteredUsers();
    toast.success('Data refreshed!');
  };

  const exportData = () => {
    const csvData = [
      ['User ID', 'Name', 'Email', 'Phone', 'Registration Date', 'Claim Status', 'Claimed Date', 'Request Date'],
      ...users.map(user => [
        user.userId || 'N/A',
        user.userName || user.firstName || 'N/A',
        user.userEmail || user.email || 'N/A',
        user.phone || 'N/A',
        formatDate(user.registeredAt),
        user.claimedStatus || 'unclaimed',
        user.claimedAt ? formatDate(user.claimedAt) : 'N/A',
        user.claimedRequestAt ? formatDate(user.claimedRequestAt) : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registered-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully!');
  };

  // Filter users based on search term and status filter
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (user.userName || '').toLowerCase().includes(searchLower) ||
      (user.userEmail || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.phone || '').toLowerCase().includes(searchLower) ||
      (user.userId || '').toString().toLowerCase().includes(searchLower) ||
      (user.firstName || '').toLowerCase().includes(searchLower) ||
      (user.lastName || '').toLowerCase().includes(searchLower)
    );

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'claimed' && user.claimedStatus === 'claimed') ||
      (statusFilter === 'pending' && user.claimedStatus === 'pending') ||
      (statusFilter === 'unclaimed' && user.claimedStatus === 'unclaimed');

    return matchesSearch && matchesStatus;
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
                    Registered Users History
                  </h1>
                  <p className="text-gray-600 mt-2 text-sm flex items-center">
                    Track and manage claimed status of registered users
                  </p>
                </div>
                
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <button
                    onClick={exportData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-[5px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <FaFileExport className="text-gray-600" />
                    Export
                  </button>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaUsers className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Claimed Users</p>
                    <p className="text-2xl font-bold mt-1">{stats.claimedUsers}</p>
                    <p className="text-xs text-white/70 mt-2">
                      {stats.claimRate} of total
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaCheckCircle className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Pending Requests</p>
                    <p className="text-2xl font-bold mt-1">{stats.pendingUsers}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaClock className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Unclaimed Users</p>
                    <p className="text-2xl font-bold mt-1">{stats.unclaimedUsers}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaTimesCircle className="text-white text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[5px] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Claim Rate</p>
                    <p className="text-2xl font-bold mt-1">{stats.claimRate}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaPercentage className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* User List Section */}
            <div className="bg-white rounded-[5px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 lg:mb-0">
                    Registered Users List
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>
                    
                    {/* Claim Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="claimed">Claimed</option>
                      <option value="pending">Pending</option>
                      <option value="unclaimed">Unclaimed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-8 max-w-md mx-auto">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 animate-shimmer w-1/3"></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    </div>
                    
                    <div className="text-center mt-8">
                      <p className="text-gray-600 font-medium">Fetching registered users...</p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <FaUsers className="text-gray-300 text-4xl mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No registered users found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchTerm ? 'Try adjusting your search term' : 'Users registered through your network will appear here'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claim Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => {
                        const isClaimed = user.claimedStatus === 'claimed';
                        const isPending = user.claimedStatus === 'pending';
                        const isUnclaimed = user.claimedStatus === 'unclaimed' || !user.claimedStatus;
                        
                        return (
                          <tr key={user.userId || user._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {user.userName?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center mt-1">
                                    <FaIdCard className="mr-1" />
                                    ID: {(user.userId)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900 flex items-center">
                                  <FaCalendar className="mr-2 text-gray-400" />
                                  {formatDate(user.registeredAt)}
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div>
                                  {getClaimStatusBadge(user.claimedStatus)}
                                </div>
                                {user.claimedAt && user.claimedStatus === 'claimed' && (
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <FaCalendar className="mr-1" />
                                    Claimed: {formatDate(user.claimedAt)}
                                  </div>
                                )}
                                {user.claimedRequestAt && user.claimedStatus === 'pending' && (
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <FaClock className="mr-1" />
                                    Requested: {formatDate(user.claimedRequestAt)}
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                {isClaimed ? (
                                  <button
                                    disabled={true}
                                    className="px-3 py-1 border-[1px] border-gray-300 bg-gray-100 text-gray-500 rounded-[5px] text-sm font-medium cursor-not-allowed flex items-center"
                                  >
                                    <FaCheck className="mr-1" />
                                    Claimed
                                  </button>
                                ) : isPending ? (
                                  <button
                                    onClick={() => updateClaimStatus(user.userId || user.userId?._id, 'unclaimed')}
                                    disabled={updatingClaim[user.userId]}
                                    className="px-3 py-1 border-[1px] border-yellow-400 cursor-pointer bg-yellow-100 text-yellow-700 rounded-[5px] text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                  >
                                    {updatingClaim[user.userId] ? (
                                      <>
                                        <FaSync className="animate-spin mr-1" />
                                        Updating...
                                      </>
                                    ) : (
                                      <>
                                        <FaTimes className="mr-1" />
                                        Cancel Request
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateClaimStatus(user.userId || user.userId?._id, 'pending')}
                                    disabled={updatingClaim[user.userId]}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 border-[1px] border-blue-500 cursor-pointer rounded-[5px] text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                  >
                                    {updatingClaim[user.userId] ? (
                                      <>
                                        <FaSync className="animate-spin mr-1" />
                                        Updating...
                                      </>
                                    ) : (
                                      <>
                                        <FaClock className="mr-1" />
                                        Send Request
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{stats.totalUsers}</span> users
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-[5px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Registrationhistory;
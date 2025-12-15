import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiUser, 
  FiDollarSign, 
  FiCreditCard, 
  FiShield, 
  FiTrendingUp,
  FiUsers,
  FiShare2,
  FiBarChart2,
  FiLogOut 
} from 'react-icons/fi';
import { GiTakeMyMoney } from "react-icons/gi";

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isActive,setIsActive]=useState(false);
  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("affiliate");
    localStorage.removeItem("affiliatetoken");
    navigate("/login");
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <FiHome className="text-[18px]" />,
      to: '/affiliate/dashboard',
      description: 'Overview of your performance'
    },
    {
      label: 'My Profile',
      icon: <FiUser className="text-[18px]" />,
      to: '/affiliate/profile',
      description: 'Manage your account details'
    },
    {
      label: 'Earnings',
      icon: <FiDollarSign className="text-[18px]" />,
      to: '/affiliate/earnings',
      description: 'Track your commissions'
    },
    {
      label: 'Payment Methods',
      icon: <FiCreditCard className="text-[18px]" />,
      to: '/affiliate/payment-methods',
      description: 'Configure payout options'
    },
    // {
    //   label: 'Performance',
    //   icon: <FiBarChart2 className="text-[18px]" />,
    //   to: '/affiliate/performance',
    //   description: 'Analytics and reports'
    // },
    {
      label: 'Payout History',
      icon: <FiTrendingUp className="text-[18px]" />,
      to: '/affiliate/payout-history',
      description: 'View past payments'
    },
    {
      label: 'Create Master Affiliate',
      icon: <FiUsers className="text-[18px]" />,
      to: '/affiliate/new-master-affiliate',
      description: 'Create a master affiliate account'
    },
    {
      label: 'All Master Affiliates',
      icon: <FiUsers className="text-[18px]" />,
      to: '/affiliate/all-master-affiliate',
      description: 'All master affiliate account'
    },
    {
      label: 'Master Payout',
      icon: <GiTakeMyMoney className="text-[18px]" />,
      to: '/affiliate/master-payout-history',
      description: 'All master affiliate account'
    },
  ];

  return (
    <>
      <aside
        className={`transition-all no-scrollbar font-poppins duration-300 fixed w-[70%] md:w-[40%] lg:w-[28%] xl:w-[17%] h-full z-[999] border-r border-gray-200 text-sm shadow-lg pt-[12vh] p-4 ${
          isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'
        } bg-white text-gray-800 overflow-y-auto`}
      >
        <div className="space-y-1">
          {menuItems.map(({ label, icon, to, description }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center w-full px-3 text-nowrap py-3 text-[15px] lg:text-[16px] cursor-pointer transition-all duration-300 group  ${
                  isActive
                    ? ' text-theme_color font-semibold border-l-4 border-theme_color'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:border-l-4 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-3 w-full justify-start">
                <span className={`group-hover:scale-110 transition-transform duration-300 ${
                  isActive ? 'text-theme_color' : 'text-gray-500'
                }`}>
                  <p>{icon}</p>
                </span>
                <div className="flex-1">
                  <div className="font-medium">{label}</div>
                </div>
              </div>
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => setShowLogoutPopup(true)}
          className="flex items-center w-full px-3 py-3 text-[15px] lg:text-[16px] cursor-pointer transition-all duration-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:translate-x-1 mt-6 group border border-transparent hover:border-red-200"
        >
          <span className="flex items-center gap-3">
            <FiLogOut className="text-[18px] group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">Logout</span>
          </span>
        </button>
      </aside>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to log out? You will be redirected to the login page.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 cursor-pointer rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
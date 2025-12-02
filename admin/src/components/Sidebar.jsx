import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers,
  FiCreditCard,
  FiUserCheck,
  FiLogOut
} from 'react-icons/fi';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("masterAffiliate");
    localStorage.removeItem("masterAffiliateToken");
    navigate("/login");
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <FiHome className="text-[18px]" />,
      to: '/admin/dashboard',
      description: 'Admin overview and analytics'
    },
    {
      label: 'User Management',
      icon: <FiUsers className="text-[18px]" />,
      to: '/affiliate/all-affiliated',
      description: 'Manage active users'
    },
    {
      label: 'Master Affiliates',
      icon: <FiUserCheck className="text-[18px]" />,
      to: '/affiliate/master-affiliates',
      description: 'Manage master affiliates'
    },
    {
      label: 'Payout Management',
      icon: <FiCreditCard className="text-[18px]" />,
      to: '/affiliate/payout',
      description: 'Approve and manage payouts'
    }
  ];

  return (
    <>
      <aside
        className={`transition-all font-poppins no-scrollbar duration-300 fixed w-[70%] md:w-[40%] lg:w-[28%] xl:w-[17%] h-full z-[999] text-sm shadow-2xl pt-[12vh] p-4 ${
          isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'
        } bg-white shadow-md text-white overflow-y-auto`}
      >
        <div className="space-y-1">
          {menuItems.map(({ label, icon, to, description }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center w-full px-3 py-3 text-[15px] lg:text-[16px] cursor-pointer transition-all duration-300 group ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30 border-l-4 border-blue-400'
                    : 'text-gray-700 hover:bg-blue-800 hover:text-white hover:translate-x-1 hover:border-l-4 hover:border-blue-600'
                }`
              }
            >
              <div className="flex items-center gap-3 w-full justify-start">
                <span className="group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{label}</div>
                </div>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutPopup(true)}
          className="flex items-center w-full px-3 py-3 text-[15px] lg:text-[16px] cursor-pointer rounded-lg transition-all duration-300 text-red-600 hover:bg-red-600/90 hover:text-white hover:translate-x-1 mt-6 group border-red-700/30 hover:border-red-500"
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
          <div className="bg-gray-800 rounded-lg p-6 w-[90%] max-w-md shadow-xl border border-blue-700/30">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Logout</h3>
            <p className="text-blue-200 text-sm mb-6">
              Are you sure you want to log out as administrator? You will be redirected to the login page.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 bg-gray-600 text-white cursor-pointer rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700 transition-colors duration-200"
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
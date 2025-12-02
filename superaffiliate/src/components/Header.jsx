import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import { FiSettings } from 'react-icons/fi';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import logo from "../assets/logo.png";
import axios from 'axios';
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import toast,{Toaster} from "react-hot-toast"

const Header = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const dropdownRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  // Fetch branding data for dynamic logo
  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBrandingData();
  }, []);

  // -------------------logout-funtion---------------------
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove localStorage data
        localStorage.removeItem('loanadmin');
        localStorage.removeItem('loantoken');

        // Optional: show a success message
        toast.success("You have been logged out.");

        // Redirect to /admin-login after a short delay
        setTimeout(() => {
          navigate("/ogin");
        }, 1000);
      }
    });
  };

  return (
    <header className='w-full h-[9vh] bg-white fixed top-0 left-0 z-[1000] px-[20px] font-nunito py-[10px] flex justify-between items-center shadow-sm border-b border-gray-200'>
     <Toaster/>
      {/* Left Side Logo + Menu */}
      <div className="logo flex justify-start items-center gap-[20px] w-full">
        <NavLink to="/dashboard" className='md:flex justify-start items-center gap-[5px] hidden md:w-[12%]'>
          <img 
            className='w-[50%]' 
            src={dynamicLogo} 
            alt="logo" 
            onError={(e) => {
              e.target.src = logo;
            }}
          />
        </NavLink>
        <div className="menu text-[25px] cursor-pointer text-gray-700 hover:text-blue-600 transition-colors duration-200" onClick={toggleSidebar}>
          <HiOutlineMenuAlt2 />
        </div>
      </div>

      {/* Right Side - Settings & Admin */}
      <div className="relative flex items-center gap-4" ref={dropdownRef}>
        <button className="text-[22px] text-gray-600 hover:text-blue-600 transition duration-200">
          <FiSettings />
        </button>

        {/* Admin Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownVisible(!dropdownVisible)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
          >
            <FiUser className="text-gray-600" />
            <span className="text-gray-700 font-medium">Admin</span>
          </button>

          {dropdownVisible && (
            <div className="absolute right-0 top-12 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
              >
                <FiLogOut className="text-[16px]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
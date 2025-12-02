const express = require("express");
const bcrypt = require("bcryptjs");
const Authrouter = express.Router();
const jwt = require("jsonwebtoken");
const Affiliate = require("../models/Affiliate");
const mongoose = require("mongoose");

// JWT Secret Keys
const JWT_SECRET = process.env.JWT_SECRET || "fsdfsdfsd43534";
const AFFILIATE_JWT_SECRET = process.env.AFFILIATE_JWT_SECRET || "dfsdfsdf535345";

// Function to generate a random player ID
const generatePlayerId = () => {
  const prefix = "PID";
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
};

// Helper function to get device info
const getDeviceInfo = (userAgent) => {
  let deviceType = 'unknown';
  let browser = 'unknown';
  let os = 'unknown';
  
  if (userAgent.includes('Mobile')) deviceType = 'mobile';
  else if (userAgent.includes('Tablet')) deviceType = 'tablet';
  else deviceType = 'desktop';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Import models
const LoginLog = require('../models/LoginLog');
const MasterAffiliate = require("../models/MasterAffiliate");

// Try to import ClickTrack, but handle if it doesn't exist
let ClickTrack;
try {
  ClickTrack = require('../models/ClickTrack');
} catch (error) {
  console.log('ClickTrack model not found, creating simplified version...');
  ClickTrack = {
    findOne: () => Promise.resolve(null),
    findOneAndUpdate: () => Promise.resolve(null),
    prototype: {
      save: () => Promise.resolve()
    }
  };
}

// Helper function to validate payment details
const validatePaymentDetails = (paymentMethod, paymentData) => {
  switch (paymentMethod) {
    case 'bkash':
    case 'nagad':
    case 'rocket':
      if (!paymentData.phoneNumber) {
        return { isValid: false, message: `${paymentMethod} phone number is required` };
      }
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(paymentData.phoneNumber)) {
        return { isValid: false, message: `Invalid ${paymentMethod} phone number format. Use Bangladeshi format: 01XXXXXXXXX` };
      }
      break;

    case 'binance':
      if (!paymentData.email) {
        return { isValid: false, message: 'Binance email is required' };
      }
      if (!paymentData.walletAddress) {
        return { isValid: false, message: 'Binance wallet address is required' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paymentData.email)) {
        return { isValid: false, message: 'Invalid Binance email format' };
      }
      break;

    default:
      return { isValid: false, message: 'Invalid payment method' };
  }
  return { isValid: true };
};

// Affiliate Registration Route
Authrouter.post("/affiliate/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      website,
      promoMethod,
      paymentMethod,
      paymentDetails // This should be the specific payment details for the selected method
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, password, first name, last name, and phone are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Validate payment method and details based on selected method
    if (paymentMethod) {
      switch (paymentMethod) {
        case 'bkash':
        case 'nagad':
        case 'rocket':
          if (!paymentDetails?.phoneNumber) {
            return res.status(400).json({
              success: false,
              message: `${paymentMethod} phone number is required`
            });
          }
          if (!/^01[3-9]\d{8}$/.test(paymentDetails.phoneNumber)) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${paymentMethod} phone number. Use format: 01XXXXXXXXX`
            });
          }
          break;
        
        case 'binance':
          if (!paymentDetails?.email) {
            return res.status(400).json({
              success: false,
              message: "Binance email is required"
            });
          }
          if (!/\S+@\S+\.\S+/.test(paymentDetails.email)) {
            return res.status(400).json({
              success: false,
              message: "Binance email is invalid"
            });
          }
          if (!paymentDetails?.walletAddress) {
            return res.status(400).json({
              success: false,
              message: "Binance wallet address is required"
            });
          }
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: "Please select a valid payment method"
          });
      }
    }

    // Check if affiliate already exists
    const existingAffiliate = await Affiliate.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });

    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: "Affiliate with this email or phone already exists"
      });
    }

    // Prepare payment details for database (match the Mongoose schema structure)
    const dbPaymentDetails = {};
    if (paymentMethod && paymentDetails) {
      // Initialize the payment method object
      dbPaymentDetails[paymentMethod] = paymentDetails;
      
      // Set default accountType for mobile payment methods if not provided
      if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
        if (!dbPaymentDetails[paymentMethod].accountType) {
          dbPaymentDetails[paymentMethod].accountType = 'personal';
        }
      }
    }

    // Create new affiliate
    const affiliate = new Affiliate({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      company: company || '',
      website: website || '',
      promoMethod: promoMethod || 'other',
      paymentMethod: paymentMethod || 'bkash',
      paymentDetails: dbPaymentDetails,
      status: 'pending',
    });

    await affiliate.save();

    res.status(201).json({
      success: true,
      message: "Affiliate registered successfully. Please wait for admin approval.",
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        verificationStatus: affiliate.verificationStatus
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Affiliate with this email or phone already exists"
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error during registration"
    });
  }
});

// Affiliate login
Authrouter.post("/affiliate/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const affiliate = await Affiliate.findOne({ email: email.toLowerCase() });
    if (!affiliate) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (affiliate.status !== 'active') {
      return res.json({
        success: false,
        message: `Your account is ${affiliate.status}. Please wait for admin approval before logging in.`
      });
    }

    const isPasswordValid = await affiliate.comparePassword(password);
    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    affiliate.lastLogin = new Date();
    await affiliate.save();

    const token = jwt.sign(
      { affiliateId: affiliate._id, email: affiliate.email },
      AFFILIATE_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        fullName: affiliate.fullName,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        verificationStatus: affiliate.verificationStatus,
        lastLogin: affiliate.lastLogin
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login"
    });
  }
});
// Master Affiliate Login Route
Authrouter.post("/master-affiliate/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find affiliate with master_affiliate role
    const masterAffiliate = await MasterAffiliate.findOne({ 
      email: email.toLowerCase(),
      role: 'master_affiliate'
    });

    if (!masterAffiliate) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if master affiliate account is active
    if (masterAffiliate.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your master affiliate account is ${masterAffiliate.status}. Please contact admin or your super affiliate for activation.`
      });
    }

    // Verify password
    const isPasswordValid = await masterAffiliate.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Update last login
    masterAffiliate.lastLogin = new Date();
    await masterAffiliate.save();

    // Generate master affiliate specific JWT token
    const token = jwt.sign(
      { 
        masterAffiliateId: masterAffiliate._id, 
        email: masterAffiliate.email,
        role: 'master_affiliate',
        createdBy: masterAffiliate.createdBy
      },
      AFFILIATE_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: "Master affiliate login successful",
      token,
      masterAffiliate: {
        id: masterAffiliate._id,
        email: masterAffiliate.email,
        firstName: masterAffiliate.firstName,
        lastName: masterAffiliate.lastName,
        fullName: masterAffiliate.fullName,
        affiliateCode: masterAffiliate.affiliateCode,
        role: masterAffiliate.role,
        status: masterAffiliate.status,
        verificationStatus: masterAffiliate.verificationStatus,
        commissionRate: masterAffiliate.commissionRate,
        depositRate: masterAffiliate.depositRate,
        totalEarnings: masterAffiliate.totalEarnings,
        pendingEarnings: masterAffiliate.pendingEarnings,
        paidEarnings: masterAffiliate.paidEarnings,
        referralCount: masterAffiliate.referralCount,
        lastLogin: masterAffiliate.lastLogin,
        createdBy: masterAffiliate.createdBy
      }
    });

  } catch (error) {
    console.error("Master affiliate login error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({
        success: false,
        message: "Token generation error"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error during login"
    });
  }
});
// Check if affiliate referral code exists
Authrouter.get("/affiliate/check-referral/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Affiliate code is required"
      });
    }
    
    const affiliate = await Affiliate.findOne({ 
      affiliateCode: code.toUpperCase(),
      status: 'active'
    });
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Invalid affiliate code"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Affiliate code is valid",
      affiliate: {
        name: affiliate.fullName,
        company: affiliate.company,
        affiliateCode: affiliate.affiliateCode
      }
    });
  } catch (error) {
    console.error("Check affiliate referral error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get affiliate profile
Authrouter.get("/affiliate/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const decoded = jwt.verify(token, AFFILIATE_JWT_SECRET);
    const affiliate = await Affiliate.findById(decoded.affiliateId);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        fullName: affiliate.fullName,
        phone: affiliate.phone,
        company: affiliate.company,
        website: affiliate.website,
        affiliateCode: affiliate.affiliateCode,
        commissionRate: affiliate.commissionRate,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        paidEarnings: affiliate.paidEarnings,
        referralCount: affiliate.referralCount,
        clickCount: affiliate.clickCount,
        isActive: affiliate.isActive,
        isVerified: affiliate.isVerified,
        paymentMethod: affiliate.paymentMethod,
        minimumPayout: affiliate.minimumPayout,
        lastLogin: affiliate.lastLogin,
        createdAt: affiliate.createdAt
      }
    });
  } catch (error) {
    console.error("Get affiliate profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = Authrouter;
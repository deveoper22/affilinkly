const express = require("express");
const Affiliate = require("../models/Affiliate");
const MasterAffiliate = require("../models/MasterAffiliate");
const Payout = require("../models/Payout");
const Adminrouter = express.Router();

// Utility function for error handling
const handleError = (res, error, message = "An error occurred") => {
  console.error(error);
  res.status(500).json({ 
    success: false, 
    message, 
    error: error.message 
  });
};

// ========== AFFILIATE ROUTES ==========

// Get all affiliates with filtering and pagination
Adminrouter.get("/affiliates", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { affiliateCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const affiliates = await Affiliate.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    const total = await Affiliate.countDocuments(query);

    res.json({
      success: true,
      data: affiliates,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch affiliates");
  }
});

// Get single affiliate by ID
Adminrouter.get("/affiliates/:id", async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('referredUsers.user', 'firstName lastName email')
      .populate('earningsHistory.referredUser', 'firstName lastName email');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch affiliate");
  }
});

// Update affiliate
Adminrouter.put("/affiliates/:id", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      company,
      website,
      promoMethod,
      socialMediaProfiles,
      address,
      status,
      verificationStatus,
      role,
      paymentMethod,
      paymentDetails,
      minimumPayout,
      payoutSchedule,
      autoPayout,
      notes,
      tags
    } = req.body;

    const updateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(company && { company }),
      ...(website && { website }),
      ...(promoMethod && { promoMethod }),
      ...(socialMediaProfiles && { socialMediaProfiles }),
      ...(address && { address }),
      ...(status && { status }),
      ...(verificationStatus && { verificationStatus }),
      ...(role && { role }),
      ...(paymentMethod && { paymentMethod }),
      ...(paymentDetails && { paymentDetails }),
      ...(minimumPayout && { minimumPayout }),
      ...(payoutSchedule && { payoutSchedule }),
      ...(autoPayout !== undefined && { autoPayout }),
      ...(notes && { notes }),
      ...(tags && { tags })
    };

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Affiliate updated successfully",
      data: affiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to update affiliate");
  }
});

// Update affiliate commission rates
Adminrouter.put("/affiliates/:id/commission", async (req, res) => {
  try {
    const {
      commissionRate,
      depositRate,
      commissionType,
      cpaRate
    } = req.body;

    // Validate commission rates
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        success: false,
        message: "Commission rate must be between 0 and 100"
      });
    }

    if (depositRate !== undefined && (depositRate < 0 || depositRate > 100)) {
      return res.status(400).json({
        success: false,
        message: "Deposit rate must be between 0 and 100"
      });
    }

    if (cpaRate !== undefined && cpaRate < 0) {
      return res.status(400).json({
        success: false,
        message: "CPA rate cannot be negative"
      });
    }

    const updateData = {
      ...(commissionRate !== undefined && { commissionRate }),
      ...(depositRate !== undefined && { depositRate }),
      ...(commissionType && { commissionType }),
      ...(cpaRate !== undefined && { cpaRate })
    };

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Commission rates updated successfully",
      data: affiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to update commission rates");
  }
});

// Delete affiliate
Adminrouter.delete("/affiliates/:id", async (req, res) => {
  try {
    const affiliate = await Affiliate.findByIdAndDelete(req.params.id);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Affiliate deleted successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to delete affiliate");
  }
});

// Bulk update affiliate status
Adminrouter.put("/affiliates/bulk/status", async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid affiliate IDs"
      });
    }

    if (!status || !['pending', 'active', 'suspended', 'banned', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const result = await Affiliate.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    res.json({
      success: true,
      message: `Status updated for ${result.modifiedCount} affiliates`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    handleError(res, error, "Failed to update affiliate status");
  }
});

// ========== MASTER AFFILIATE ROUTES ==========

// Get all master affiliates
Adminrouter.get("/master-affiliates", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { masterCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const masterAffiliates = await MasterAffiliate.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('createdBy', 'firstName lastName email affiliateCode');

    const total = await MasterAffiliate.countDocuments(query);

    res.json({
      success: true,
      data: masterAffiliates,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch master affiliates");
  }
});
Adminrouter.get("/master-affiliates/:affilaiteid", async (req, res) => {
  try {
    const masterAffiliates = await MasterAffiliate.find({createdBy:req.params.affilaiteid})
      .sort({createdAt:-1})
    res.json({
      success: true,
      data: masterAffiliates,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch master affiliates");
  }
});
// Get single master affiliate by ID
Adminrouter.get("/master-affiliates/:id", async (req, res) => {
  try {
    const masterAffiliate = await MasterAffiliate.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('createdBy', 'firstName lastName email affiliateCode')
      .populate('subAffiliates.affiliate', 'firstName lastName email affiliateCode totalEarnings')
      .populate('earningsHistory.sourceAffiliate', 'firstName lastName email');

    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    res.json({
      success: true,
      data: masterAffiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch master affiliate");
  }
});

// Update master affiliate
Adminrouter.put("/master-affiliates/:id", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      company,
      website,
      promoMethod,
      socialMediaProfiles,
      address,
      status,
      verificationStatus,
      paymentMethod,
      paymentDetails,
      minimumPayout,
      payoutSchedule,
      autoPayout,
      notes,
      tags
    } = req.body;

    const updateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(company && { company }),
      ...(website && { website }),
      ...(promoMethod && { promoMethod }),
      ...(socialMediaProfiles && { socialMediaProfiles }),
      ...(address && { address }),
      ...(status && { status }),
      ...(verificationStatus && { verificationStatus }),
      ...(paymentMethod && { paymentMethod }),
      ...(paymentDetails && { paymentDetails }),
      ...(minimumPayout && { minimumPayout }),
      ...(payoutSchedule && { payoutSchedule }),
      ...(autoPayout !== undefined && { autoPayout }),
      ...(notes && { notes }),
      ...(tags && { tags })
    };

    const masterAffiliate = await MasterAffiliate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Master affiliate updated successfully",
      data: masterAffiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to update master affiliate");
  }
});

// Update master affiliate commission and override rates
Adminrouter.put("/master-affiliates/:id/commission", async (req, res) => {
  try {
    const {
      commissionRate,
      depositRate,
      commissionType,
      cpaRate,
      overrideCommission
    } = req.body;

    // Validate rates
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({
        success: false,
        message: "Commission rate must be between 0 and 100"
      });
    }

    if (depositRate !== undefined && (depositRate < 0 || depositRate > 100)) {
      return res.status(400).json({
        success: false,
        message: "Deposit rate must be between 0 and 100"
      });
    }

    if (cpaRate !== undefined && cpaRate < 0) {
      return res.status(400).json({
        success: false,
        message: "CPA rate cannot be negative"
      });
    }

    if (overrideCommission !== undefined && (overrideCommission < 0 || overrideCommission > 100)) {
      return res.status(400).json({
        success: false,
        message: "Override commission must be between 0 and 100"
      });
    }

    const updateData = {
      ...(commissionRate !== undefined && { commissionRate }),
      ...(depositRate !== undefined && { depositRate }),
      ...(commissionType && { commissionType }),
      ...(cpaRate !== undefined && { cpaRate }),
      ...(overrideCommission !== undefined && { 
        'masterEarnings.overrideCommission': overrideCommission 
      })
    };

    const masterAffiliate = await MasterAffiliate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Commission rates updated successfully",
      data: masterAffiliate
    });
  } catch (error) {
    handleError(res, error, "Failed to update commission rates");
  }
});

// Add sub-affiliate to master affiliate
Adminrouter.post("/master-affiliates/:id/sub-affiliates", async (req, res) => {
  try {
    const { affiliateId, customCommissionRate, customDepositRate } = req.body;

    if (!affiliateId) {
      return res.status(400).json({
        success: false,
        message: "Affiliate ID is required"
      });
    }

    // Check if affiliate exists
    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    const masterAffiliate = await MasterAffiliate.findById(req.params.id);
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    await masterAffiliate.addSubAffiliate(
      affiliateId, 
      customCommissionRate, 
      customDepositRate
    );

    res.json({
      success: true,
      message: "Sub-affiliate added successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to add sub-affiliate");
  }
});

// Remove sub-affiliate from master affiliate
Adminrouter.delete("/master-affiliates/:id/sub-affiliates/:affiliateId", async (req, res) => {
  try {
    const masterAffiliate = await MasterAffiliate.findById(req.params.id);
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    await masterAffiliate.removeSubAffiliate(req.params.affiliateId);

    res.json({
      success: true,
      message: "Sub-affiliate removed successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to remove sub-affiliate");
  }
});

// Delete master affiliate
Adminrouter.delete("/master-affiliates/:id", async (req, res) => {
  try {
    const masterAffiliate = await MasterAffiliate.findByIdAndDelete(req.params.id);

    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }

    res.json({
      success: true,
      message: "Master affiliate deleted successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to delete master affiliate");
  }
});

// ========== COMMISSION MANAGEMENT ROUTES ==========

// Get commission statistics
Adminrouter.get("/commission/stats", async (req, res) => {
  try {
    const affiliateStats = await Affiliate.getStats();
    const masterStats = await MasterAffiliate.getStats();

    res.json({
      success: true,
      data: {
        affiliates: affiliateStats,
        masterAffiliates: masterStats
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch commission statistics");
  }
});

// Bulk update commission rates
Adminrouter.put("/commission/bulk-update", async (req, res) => {
  try {
    const { 
      type, // 'affiliate' or 'master'
      ids, 
      commissionRate, 
      depositRate,
      overrideCommission 
    } = req.body;

    if (!type || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "Type and IDs are required"
      });
    }

    const updateData = {};
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (depositRate !== undefined) updateData.depositRate = depositRate;
    if (overrideCommission !== undefined) {
      updateData['masterEarnings.overrideCommission'] = overrideCommission;
    }

    let result;
    if (type === 'affiliate') {
      result = await Affiliate.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );
    } else if (type === 'master') {
      result = await MasterAffiliate.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'affiliate' or 'master'"
      });
    }

    res.json({
      success: true,
      message: `Commission rates updated for ${result.modifiedCount} ${type}s`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    handleError(res, error, "Failed to update commission rates");
  }
});

// ========== ADMIN OVERVIEW ==========

Adminrouter.get("/admin-overview", async (req, res) => {
  try {
    const [allaffiliate, allmasteraffiliate, payout, affiliateStats, masterStats] = await Promise.all([
      Affiliate.find().select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken'),
      MasterAffiliate.find().select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken'),
      Payout.find(),
      Affiliate.getStats(),
      MasterAffiliate.getStats()
    ]);

    // Calculate overview statistics
    const overview = {
      totalAffiliates: affiliateStats.totalAffiliates,
      totalMasterAffiliates: masterStats.totalMasters,
      totalEarnings: affiliateStats.totalEarnings + masterStats.totalEarnings,
      pendingPayouts: affiliateStats.pendingPayouts + masterStats.pendingPayouts,
      totalReferrals: affiliateStats.totalReferrals,
      totalPayouts: payout.length,
      totalPayoutAmount: payout.reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({
      success: true,
      data: {
        overview,
        affiliates: allaffiliate,
        masterAffiliates: allmasteraffiliate,
        payouts: payout
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch admin overview");
  }
});

// ========== PAYOUT ROUTES ==========

// Get all payouts with filtering and pagination
Adminrouter.get("/payouts", async (req, res) => {
  try {
    const payouts = await Payout.find()
      .sort({createdAt:-1})

    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch payouts");
  }
});

// Get single payout by ID
Adminrouter.get("/payouts/:id", async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate('affiliate', 'firstName lastName email phone affiliateCode paymentMethod paymentDetails')
      .populate('processedBy', 'firstName lastName email')
      .populate('verification.verifiedBy', 'firstName lastName email');

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch payout");
  }
});

// Create a new payout
Adminrouter.post("/payouts", async (req, res) => {
  try {
    const {
      affiliate,
      amount,
      currency,
      paymentMethod,
      paymentDetails,
      payoutType,
      commissionBreakdown,
      fees,
      includedEarnings,
      estimatedCompletionDate,
      priority,
      internalNotes
    } = req.body;

    // Validate required fields
    if (!affiliate || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Affiliate, amount, and payment method are required"
      });
    }

    // Check if affiliate exists
    const affiliateExists = await Affiliate.findById(affiliate);
    if (!affiliateExists) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    // Check if affiliate has sufficient balance
    if (affiliateExists.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Affiliate has insufficient balance for this payout"
      });
    }

    const payoutData = {
      affiliate,
      amount,
      currency: currency || 'BDT',
      paymentMethod,
      paymentDetails,
      payoutType: payoutType || 'regular',
      commissionBreakdown,
      fees,
      includedEarnings,
      estimatedCompletionDate,
      priority: priority || 'normal',
      internalNotes
    };

    const payout = new Payout(payoutData);
    await payout.save();

    // Populate the created payout
    await payout.populate('affiliate', 'firstName lastName email affiliateCode');

    res.status(201).json({
      success: true,
      message: "Payout created successfully",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to create payout");
  }
});

// Update payout status
Adminrouter.put("/payouts/:id/status", async (req, res) => {
  try {
    const { status, processorNotes, processedBy, failureReason, failureDetails } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    await payout.updateStatus(status, processorNotes, processedBy);

    // Handle failure reasons
    if (status === 'failed') {
      payout.failureReason = failureReason;
      payout.failureDetails = failureDetails;
      await payout.save();
    }

    // Update affiliate balance if payout is completed
    if (status === 'completed') {
      const affiliate = await Affiliate.findById(payout.affiliate);
      if (affiliate) {
        affiliate.availableBalance -= payout.amount;
        affiliate.totalPayouts += payout.amount;
        affiliate.lastPayoutDate = new Date();
        await affiliate.save();
      }
    }

    res.json({
      success: true,
      message: `Payout status updated to ${status}`,
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to update payout status");
  }
});

// Process payout (admin action)
Adminrouter.post("/payouts/:id/process", async (req, res) => {
  try {
    const { processedBy, processorNotes, estimatedCompletionDate } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Payout is not in pending status"
      });
    }

    payout.status = 'processing';
    payout.processedBy = processedBy;
    payout.processedAt = new Date();
    
    if (processorNotes) {
      payout.processorNotes = processorNotes;
    }
    
    if (estimatedCompletionDate) {
      payout.estimatedCompletionDate = new Date(estimatedCompletionDate);
    }

    await payout.save();
    await payout.populate('processedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: "Payout is now being processed",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to process payout");
  }
});

// Complete payout
Adminrouter.post("/payouts/:id/complete", async (req, res) => {
  try {
    const { transactionId, paymentDetails, processorNotes } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (payout.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: "Payout is not in processing status"
      });
    }

    // Update payment details with transaction ID if provided
    if (transactionId) {
      switch (payout.paymentMethod) {
        case 'bkash':
          payout.paymentDetails.bkash.transactionId = transactionId;
          break;
        case 'nagad':
          payout.paymentDetails.nagad.transactionId = transactionId;
          break;
        case 'rocket':
          payout.paymentDetails.rocket.transactionId = transactionId;
          break;
        case 'binance':
          payout.paymentDetails.binance.transactionHash = transactionId;
          break;
        case 'crypto':
          payout.paymentDetails.crypto.transactionHash = transactionId;
          break;
        case 'bank_transfer':
          payout.paymentDetails.bank_transfer.referenceNumber = transactionId;
          break;
        case 'other':
          payout.paymentDetails.other.transactionId = transactionId;
          break;
      }
    }

    // Update additional payment details if provided
    if (paymentDetails) {
      Object.keys(paymentDetails).forEach(key => {
        if (payout.paymentDetails[payout.paymentMethod]) {
          payout.paymentDetails[payout.paymentMethod][key] = paymentDetails[key];
        }
      });
    }

    await payout.updateStatus('completed', processorNotes);

    // Update affiliate balance and payout history
    const affiliate = await Affiliate.findById(payout.affiliate);
    if (affiliate) {
      affiliate.availableBalance -= payout.amount;
      affiliate.totalPayouts += payout.amount;
      affiliate.lastPayoutDate = new Date();
      
      // Add to payout history
      affiliate.payoutHistory.push({
        payoutId: payout._id,
        amount: payout.amount,
        date: new Date(),
        status: 'completed'
      });
      
      await affiliate.save();
    }

    res.json({
      success: true,
      message: "Payout completed successfully",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to complete payout");
  }
});

// Fail payout
Adminrouter.post("/payouts/:id/fail", async (req, res) => {
  try {
    const { failureReason, failureDetails, processorNotes, processedBy } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (!['pending', 'processing'].includes(payout.status)) {
      return res.status(400).json({
        success: false,
        message: "Payout cannot be failed in its current status"
      });
    }

    payout.failureReason = failureReason;
    payout.failureDetails = failureDetails;
    
    await payout.updateStatus('failed', processorNotes, processedBy);

    res.json({
      success: true,
      message: "Payout marked as failed",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to mark payout as failed");
  }
});

// Retry failed payout
Adminrouter.post("/payouts/:id/retry", async (req, res) => {
  try {
    const { processorNotes } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (!payout.canRetry()) {
      return res.status(400).json({
        success: false,
        message: "Payout cannot be retried. Maximum retry attempts reached or invalid status."
      });
    }

    await payout.retry(processorNotes);

    res.json({
      success: true,
      message: "Payout retry initiated",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to retry payout");
  }
});

// Cancel payout
Adminrouter.post("/payouts/:id/cancel", async (req, res) => {
  try {
    const { processorNotes, processedBy } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (!['pending', 'processing'].includes(payout.status)) {
      return res.status(400).json({
        success: false,
        message: "Payout cannot be cancelled in its current status"
      });
    }

    await payout.updateStatus('cancelled', processorNotes, processedBy);

    res.json({
      success: true,
      message: "Payout cancelled successfully",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to cancel payout");
  }
});

// Update payout verification
Adminrouter.put("/payouts/:id/verification", async (req, res) => {
  try {
    const { required, verifiedBy, verificationNotes, verified } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (required !== undefined) {
      payout.verification.required = required;
    }

    if (verified) {
      payout.verification.verifiedBy = verifiedBy;
      payout.verification.verifiedAt = new Date();
      payout.verification.verificationNotes = verificationNotes;
    } else {
      payout.verification.verifiedBy = null;
      payout.verification.verifiedAt = null;
      payout.verification.verificationNotes = verificationNotes;
    }

    await payout.save();
    await payout.populate('verification.verifiedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: "Payout verification updated",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to update payout verification");
  }
});

// Add earning to payout
Adminrouter.post("/payouts/:id/earnings", async (req, res) => {
  try {
    const { earningId, amount, type, description, earnedAt } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Cannot add earnings to a payout that is not pending"
      });
    }

    payout.addEarning(earningId, amount, type, description, earnedAt ? new Date(earnedAt) : null);
    await payout.save();

    res.json({
      success: true,
      message: "Earning added to payout successfully",
      data: payout
    });
  } catch (error) {
    handleError(res, error, "Failed to add earning to payout");
  }
});

// Calculate and update fees for payout
Adminrouter.post("/payouts/:id/calculate-fees", async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    payout.calculateFees();
    await payout.save();

    res.json({
      success: true,
      message: "Fees calculated successfully",
      data: {
        fees: payout.fees,
        netAmount: payout.netAmount
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to calculate fees");
  }
});

// Bulk update payout status
Adminrouter.put("/payouts/bulk/status", async (req, res) => {
  try {
    const { ids, status, processorNotes, processedBy } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout IDs"
      });
    }

    if (!status || !['pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const result = await Payout.updateMany(
      { _id: { $in: ids } },
      { 
        $set: { 
          status,
          processedBy,
          processorNotes: processorNotes || `Bulk status update to ${status}`,
          ...(status === 'processing' && { processedAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() })
        } 
      }
    );

    res.json({
      success: true,
      message: `Status updated for ${result.modifiedCount} payouts`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    handleError(res, error, "Failed to update payout status");
  }
});

// Get payout statistics
Adminrouter.get("/payouts/stats/overview", async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const stats = await Payout.getStats(period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch payout statistics");
  }
});

// Get pending payouts
Adminrouter.get("/payouts/queue/pending", async (req, res) => {
  try {
    const payouts = await Payout.getPendingPayouts();

    res.json({
      success: true,
      data: payouts,
      total: payouts.length
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch pending payouts");
  }
});

// Get overdue payouts
Adminrouter.get("/payouts/queue/overdue", async (req, res) => {
  try {
    const payouts = await Payout.getOverduePayouts();

    res.json({
      success: true,
      data: payouts,
      total: payouts.length
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch overdue payouts");
  }
});

// Get payouts by affiliate
Adminrouter.get("/affiliates/:affiliateId/payouts", async (req, res) => {
  try {
    const { affiliateId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const payouts = await Payout.findByAffiliate(affiliateId, filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payout.countDocuments({ affiliate: affiliateId });

    res.json({
      success: true,
      data: payouts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch affiliate payouts");
  }
});

// Delete payout (admin only)
Adminrouter.delete("/payouts/:id", async (req, res) => {
  try {
    const payout = await Payout.findByIdAndDelete(req.params.id);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found"
      });
    }

    res.json({
      success: true,
      message: "Payout deleted successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to delete payout");
  }
});
// Add these routes to your admin router:

// ========== MASTER AFFILIATE ANALYTICS ROUTES ==========

// Get master affiliate analytics
Adminrouter.get("/master-affiliates/:id/analytics", async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = 'month' } = req.query;
    
    const masterAffiliate = await MasterAffiliate.findById(id)
    
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }
    
    const analytics = masterAffiliate.getPerformanceAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch analytics");
  }
});

// Get master affiliate earnings summary
Adminrouter.get("/master-affiliates/:id/earnings-summary", async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const masterAffiliate = await MasterAffiliate.findById(id)
      .populate('earningsHistory.sourceAffiliate', 'firstName lastName email affiliateCode');
    
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }
    
    const summary = masterAffiliate.getEarningsSummary(startDate, endDate);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch earnings summary");
  }
});

// Update sub-affiliate status
Adminrouter.put("/master-affiliates/:id/sub-affiliates/:affiliateId/status", async (req, res) => {
  try {
    const { id, affiliateId } = req.params;
    const { status, reason } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required"
      });
    }
    
    const masterAffiliate = await MasterAffiliate.findById(id);
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }
    
    await masterAffiliate.updateSubAffiliateStatus(affiliateId, status, reason);
    
    res.json({
      success: true,
      message: `Sub-affiliate status updated to ${status}`
    });
  } catch (error) {
    handleError(res, error, "Failed to update sub-affiliate status");
  }
});

// Get master affiliate dashboard data
Adminrouter.get("/master-affiliates/:id/dashboard", async (req, res) => {
  try {
    const masterAffiliate = await MasterAffiliate.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('subAffiliates.affiliate', 'firstName lastName email affiliateCode totalEarnings status')
      .populate('earningsHistory.sourceAffiliate', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email affiliateCode');
    
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }
    
    const dashboardData = {
      masterInfo: {
        id: masterAffiliate._id,
        fullName: masterAffiliate.fullName,
        email: masterAffiliate.email,
        masterCode: masterAffiliate.masterCode,
        status: masterAffiliate.status,
        verificationStatus: masterAffiliate.verificationStatus,
        createdAt: masterAffiliate.createdAt
      },
      earnings: {
        total: masterAffiliate.masterEarnings.totalEarnings,
        pending: masterAffiliate.masterEarnings.pendingEarnings,
        paid: masterAffiliate.masterEarnings.paidEarnings,
        thisMonth: masterAffiliate.earningsThisMonth,
        overrideRate: masterAffiliate.masterEarnings.overrideCommission
      },
      subAffiliates: {
        total: masterAffiliate.totalSubAffiliates,
        active: masterAffiliate.activeSubAffiliates,
        list: masterAffiliate.subAffiliates.slice(0, 10) // Top 10
      },
      recentEarnings: masterAffiliate.earningsHistory
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 10),
      performanceStats: masterAffiliate.getPerformanceStats(),
      paymentInfo: masterAffiliate.formattedPaymentDetails
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch dashboard data");
  }
});

// ========== BULK MASTER AFFILIATE OPERATIONS ==========

// Bulk update master affiliate status
Adminrouter.put("/master-affiliates/bulk/status", async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid master affiliate IDs"
      });
    }
    
    if (!status || !['pending', 'active', 'suspended', 'banned', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    const result = await MasterAffiliate.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    
    res.json({
      success: true,
      message: `Status updated for ${result.modifiedCount} master affiliates`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    handleError(res, error, "Failed to update master affiliate status");
  }
});

// Bulk add earnings to master affiliates
Adminrouter.post("/master-affiliates/bulk/add-earnings", async (req, res) => {
  try {
    const { earnings } = req.body;
    
    if (!earnings || !Array.isArray(earnings)) {
      return res.status(400).json({
        success: false,
        message: "Earnings array is required"
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const earning of earnings) {
      try {
        const { masterAffiliateId, amount, sourceAffiliate, sourceType, sourceAmount, description } = earning;
        
        const masterAffiliate = await MasterAffiliate.findById(masterAffiliateId);
        if (!masterAffiliate) {
          errors.push(`Master affiliate not found: ${masterAffiliateId}`);
          continue;
        }
        
        await masterAffiliate.addOverrideCommission(
          amount,
          sourceAffiliate,
          sourceType,
          sourceAmount,
          null,
          description || 'Bulk earning addition'
        );
        
        results.push({
          masterAffiliateId,
          success: true,
          amount
        });
      } catch (error) {
        errors.push(`Failed for ${earning.masterAffiliateId}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.length} earnings, ${errors.length} errors`,
      results,
      errors
    });
  } catch (error) {
    handleError(res, error, "Failed to bulk add earnings");
  }
});

// ========== MASTER AFFILIATE PAYOUT MANAGEMENT ==========

// Process master affiliate payout
Adminrouter.post("/master-affiliates/:id/payout", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, transactionId, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }
    
    const masterAffiliate = await MasterAffiliate.findById(id);
    if (!masterAffiliate) {
      return res.status(404).json({
        success: false,
        message: "Master affiliate not found"
      });
    }
    
    await masterAffiliate.processPayout(amount, transactionId, notes);
    
    res.json({
      success: true,
      message: "Payout processed successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to process payout");
  }
});

// Get master affiliate payout history
Adminrouter.get("/master-affiliates/:id/payout-history", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const payouts = await Payout.find({ masterAffiliate: id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payout.countDocuments({ masterAffiliate: id });
    
    res.json({
      success: true,
      data: payouts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch payout history");
  }
});

// ========== SEARCH AND FILTER ROUTES ==========

// Search master affiliates with advanced filtering
Adminrouter.get("/master-affiliates/search/advanced", async (req, res) => {
  try {
    const {
      query,
      status,
      verificationStatus,
      paymentMethod,
      minEarnings,
      maxEarnings,
      minSubAffiliates,
      maxSubAffiliates,
      createdAfter,
      createdBefore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    const searchQuery = {};
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { masterCode: { $regex: query, $options: 'i' } },
        { customMasterCode: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status && status !== 'all') {
      searchQuery.status = status;
    }
    
    // Verification status filter
    if (verificationStatus && verificationStatus !== 'all') {
      searchQuery.verificationStatus = verificationStatus;
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      searchQuery.paymentMethod = paymentMethod;
    }
    
    // Earnings range filter
    if (minEarnings || maxEarnings) {
      searchQuery['masterEarnings.totalEarnings'] = {};
      if (minEarnings) searchQuery['masterEarnings.totalEarnings'].$gte = parseFloat(minEarnings);
      if (maxEarnings) searchQuery['masterEarnings.totalEarnings'].$lte = parseFloat(maxEarnings);
    }
    
    // Sub-affiliates range filter
    if (minSubAffiliates || maxSubAffiliates) {
      searchQuery.totalSubAffiliates = {};
      if (minSubAffiliates) searchQuery.totalSubAffiliates.$gte = parseInt(minSubAffiliates);
      if (maxSubAffiliates) searchQuery.totalSubAffiliates.$lte = parseInt(maxSubAffiliates);
    }
    
    // Date range filter
    if (createdAfter || createdBefore) {
      searchQuery.createdAt = {};
      if (createdAfter) searchQuery.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) searchQuery.createdAt.$lte = new Date(createdBefore);
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const masterAffiliates = await MasterAffiliate.find(searchQuery)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('createdBy', 'firstName lastName email affiliateCode');
    
    const total = await MasterAffiliate.countDocuments(searchQuery);
    
    res.json({
      success: true,
      data: masterAffiliates,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to search master affiliates");
  }
});

// ========== IMPORT/EXPORT ROUTES ==========

// Export master affiliates to CSV
Adminrouter.get("/master-affiliates/export/csv", async (req, res) => {
  try {
    const masterAffiliates = await MasterAffiliate.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('createdBy', 'firstName lastName email');
    
    // Convert to CSV
    const csvRows = [];
    csvRows.push([
      'ID', 'Master Code', 'Name', 'Email', 'Phone', 'Status',
      'Total Earnings', 'Pending Earnings', 'Paid Earnings',
      'Total Sub-Affiliates', 'Active Sub-Affiliates',
      'Created At', 'Created By'
    ].join(','));
    
    masterAffiliates.forEach(ma => {
      csvRows.push([
        ma._id,
        ma.masterCode,
        `${ma.firstName} ${ma.lastName}`,
        ma.email,
        ma.phone,
        ma.status,
        ma.masterEarnings.totalEarnings,
        ma.masterEarnings.pendingEarnings,
        ma.masterEarnings.paidEarnings,
        ma.totalSubAffiliates,
        ma.activeSubAffiliates,
        ma.createdAt.toISOString(),
        ma.createdBy ? `${ma.createdBy.firstName} ${ma.createdBy.lastName}` : 'N/A'
      ].join(','));
    });
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=master-affiliates.csv');
    res.send(csv);
  } catch (error) {
    handleError(res, error, "Failed to export CSV");
  }
});

// Import master affiliates from CSV
Adminrouter.post("/master-affiliates/import/csv", async (req, res) => {
  try {
    // This would require file upload handling
    // For now, return a placeholder response
    res.json({
      success: true,
      message: "CSV import endpoint ready. Implement file upload logic as needed."
    });
  } catch (error) {
    handleError(res, error, "Failed to import CSV");
  }
});

// ========== SYSTEM MANAGEMENT ROUTES ==========

// Clear master affiliate cache (if using caching)
Adminrouter.post("/system/clear-cache", async (req, res) => {
  try {
    // Implement cache clearing logic here
    res.json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (error) {
    handleError(res, error, "Failed to clear cache");
  }
});

// Generate system report
Adminrouter.get("/system/report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    
    const [
      affiliateStats,
      masterStats,
      totalPayouts,
      pendingPayouts
    ] = await Promise.all([
      Affiliate.getStats(),
      MasterAffiliate.getStats(),
      Payout.countDocuments({
        status: 'completed',
        createdAt: { $gte: start, $lte: end }
      }),
      Payout.countDocuments({ status: 'pending' })
    ]);
    
    const report = {
      period: {
        start,
        end
      },
      affiliates: affiliateStats,
      masterAffiliates: masterStats,
      payouts: {
        total: totalPayouts,
        pending: pendingPayouts
      },
      generatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    handleError(res, error, "Failed to generate system report");
  }
});

module.exports = Adminrouter;
const express = require("express");
const router = express.Router();

// 1. REGISTRATION CALLBACK - Handles user registration commissions
router.get("/postback", async (req, res) => {
  try {
    const { cid, status, txid } = req.query;
    
    console.log("Registration callback:", { cid, status, txid });
    
    if (status !== "success") {
      return res.json({ success: true, message: "Registration failed" });
    }
    
    const Affiliate = require("../models/Affiliate");
    const MasterAffiliate = require("../models/MasterAffiliate");
    
    // Check if master affiliate code
    const isMaster = cid.toUpperCase().startsWith("MAST");
    
    if (isMaster) {
      // Handle master affiliate
      const master = await MasterAffiliate.findOne({
        $or: [{ masterCode: cid.toUpperCase() }, { customMasterCode: cid.toUpperCase() }],
        status: 'active'
      });
      
      if (!master) {
        return res.json({ success: true, message: "Master affiliate not found" });
      }
      
      // Find affiliate who created this master
      const affiliate = await Affiliate.findOne({
        _id: master.createdBy,
        status: 'active'
      });
      
      // Pay affiliate commission
      if (affiliate) {
        const affiliateCpa = Number(affiliate.cpaRate) || 0;
        if (affiliateCpa > 0) {
          await affiliate.addRegistrationBonus(
            txid, txid, affiliateCpa,
            `Registration via master ${master.fullName}`,
            { currency: 'BDT' }
          );
        }
      }
      
      // Pay master commission
      const masterCpa = Number(master.cpaRate) || 0;
      if (masterCpa > 0) {
        const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
        const affiliateCpa = Number(affiliate.cpaRate) || 0;

        await master.addOverrideCommission(
          masterCpa,
          affiliate?._id || null,
          'registration',
          affiliateCpa || 0,
          overrideRate,
          'Registration commission'
        );
        
        // Update master earnings
        master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
        await master.save();
      }
      
    } else {
      // Handle regular affiliate
      const affiliate = await Affiliate.findOne({
        $or: [{ affiliateCode: cid.toUpperCase() }, { customAffiliateCode: cid.toUpperCase() }],
        status: 'active'
      });
      
      if (!affiliate) {
        return res.json({ success: true, message: "Affiliate not found" });
      }
      
      // Pay affiliate commission
      const affiliateCpa = Number(affiliate.cpaRate) || 0;
      if (affiliateCpa > 0) {
        await affiliate.addRegistrationBonus(
          txid, txid, affiliateCpa,
          'New user registration',
          { currency: 'BDT' }
        );
      }
      
      // Check for master affiliate
      const master = await MasterAffiliate.findOne({
        'subAffiliates.affiliate': affiliate._id,
        status: 'active'
      });
      
      // Pay master commission
      if (master) {
        const masterCpa = Number(master.cpaRate) || 0;
        if (masterCpa > 0) {
          const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
          await master.addOverrideCommission(
            masterCpa,
            affiliate._id,
            'registration',
            affiliateCpa || 0,
            overrideRate,
            'Override from affiliate registration'
          );
          
          // Update master earnings
          master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
          await master.save();
        }
      }
    }
    
    res.json({ success: true, message: "Registration commission processed" });
    
  } catch (error) {
    console.error("Registration callback error:", error);
    res.json({ success: true, message: "Registration successful, commission error" });
  }
});

// 2. DEPOSIT CALLBACK - Handles deposit commissions
router.post("/deposit-callback", async (req, res) => {
  try {
    const { userId, depositId, amount, method, affiliateCode } = req.body;
    
    console.log("Deposit callback:", { userId, amount, affiliateCode, depositId });
    
    const Affiliate = require("../models/Affiliate");
    const MasterAffiliate = require("../models/MasterAffiliate");
    const mongoose = require('mongoose');
    
    // FIRST: Find master affiliate by affiliate code
    let masterAffiliate = null;
    let regularAffiliate = null;
    
    if (affiliateCode) {
      // Check if it's a master affiliate code
      const isMasterCode = affiliateCode.toUpperCase().startsWith("MAST");
      
      if (isMasterCode) {
        // Find master affiliate by code
        masterAffiliate = await MasterAffiliate.findOne({
          $or: [
            { masterCode: affiliateCode.toUpperCase() },
            { customMasterCode: affiliateCode.toUpperCase() }
          ],
          status: 'active'
        });
        
        if (masterAffiliate) {
          console.log(`Found master affiliate: ${masterAffiliate._id}`);
          
          // SECOND: Find affiliate by createdBy of master affiliate
          regularAffiliate = await Affiliate.findOne({
            _id: masterAffiliate.createdBy,
            status: 'active'
          });
          
          if (regularAffiliate) {
            console.log(`Found regular affiliate who created master: ${regularAffiliate._id}`);
            
            // Process deposit commission for the affiliate (who created the master)
            const depositRate = Number(regularAffiliate.depositRate) || 0;
            const depositCommission = (amount / 100 ) * depositRate;
            
            if (depositCommission > 0) {
              // Generate a valid ObjectId for the deposit since depositId is not a valid ObjectId
              const validDepositId = new mongoose.Types.ObjectId();
              
              await regularAffiliate.addDepositCommission(
                userId,
                validDepositId, // Use generated ObjectId instead of string
                amount,
                depositRate,
                `Deposit commission via master ${masterAffiliate.fullName}`,
                { depositMethod: method, currency: 'BDT', originalDepositId: depositId } // Store original in metadata
              );
            }
            
            // Process override commission for master affiliate
            const overrideRate = Number(masterAffiliate.masterEarnings?.overrideCommission) || 5;
            const overrideCommission = (depositCommission /100) * masterAffiliate.depositRate;
            
            if (overrideCommission > 0) {
              await masterAffiliate.addOverrideCommission(
                overrideCommission,
                regularAffiliate._id,
                'deposit_commission',
                depositCommission,
                overrideRate,
                `Deposit override commission from ${regularAffiliate.fullName}`
              );
            }
            
            return res.json({
              success: true,
              message: "Master affiliate commission processed",
              depositCommission,
              overrideCommission: overrideCommission || 0,
              commissionType: "master_affiliate"
            });
          } else {
            console.log(`No regular affiliate found for master createdBy: ${masterAffiliate.createdBy}`);
          }
        } else {
          console.log(`No master affiliate found with code: ${affiliateCode}`);
        }
      }
    }
    
    // THIRD: If no master affiliate found or no regular affiliate created the master,
    // find regular affiliate directly by referred user
    const regularAffiliateDirect = await Affiliate.findOne({
      'referredUsers.user': userId,
      status: 'active'
    });
    
    if (!regularAffiliateDirect) {
      console.log(`No affiliate found for user: ${userId}`);
      return res.json({ success: true, message: "No affiliate found for user" });
    }
    
    console.log(`Found regular affiliate by referred user: ${regularAffiliateDirect._id}`);
    
    // Calculate deposit commission for regular affiliate
    const depositRate = Number(regularAffiliateDirect.depositRate) || 0;
    const depositCommission = amount * depositRate;
    
    if (depositCommission > 0) {
      // Generate a valid ObjectId for the deposit since depositId is not a valid ObjectId
      const validDepositId = new mongoose.Types.ObjectId();
      
      await regularAffiliateDirect.addDepositCommission(
        userId,
        validDepositId, // Use generated ObjectId instead of string
        amount,
        depositRate,
        `Deposit commission`,
        { depositMethod: method, currency: 'BDT', originalDepositId: depositId } // Store original in metadata
      );
    }
    
    // FOURTH: Check for master affiliate who has this affiliate as sub-affiliate
    const masterOfAffiliate = await MasterAffiliate.findOne({
      'subAffiliates.affiliate': regularAffiliateDirect._id,
      status: 'active'
    });
    
    if (masterOfAffiliate) {
      console.log(`Found master affiliate for regular affiliate: ${masterOfAffiliate._id}`);
      
      const overrideRate = Number(masterOfAffiliate.masterEarnings?.overrideCommission) || 5;
      const overrideCommission = depositCommission * (overrideRate / 100);
      
      if (overrideCommission > 0) {
        await masterOfAffiliate.addOverrideCommission(
          overrideCommission,
          regularAffiliateDirect._id,
          'deposit_commission',
          depositCommission,
          overrideRate,
          `Deposit override commission from ${regularAffiliateDirect.fullName}`
        );
      }
      
      return res.json({
        success: true,
        message: "Deposit commission processed with master affiliate override",
        depositCommission,
        overrideCommission: overrideCommission || 0,
        commissionType: "regular_affiliate_with_master"
      });
    } else {
      console.log(`No master affiliate found for regular affiliate: ${regularAffiliateDirect._id}`);
    }
    
    res.json({
      success: true,
      message: "Deposit commission processed (regular affiliate only)",
      depositCommission,
      overrideCommission: 0,
      commissionType: "regular_affiliate_only"
    });
    
  } catch (error) {
    console.error("Deposit callback error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. BET CALLBACK - Handles bet commissions
router.post("/bet-callback", async (req, res) => {
  try {
    const { userId, betId, amount, betType, gameType } = req.body;
    
    console.log("Bet callback:", { userId, amount, betType });
    
    const Affiliate = require("../models/Affiliate");
    const MasterAffiliate = require("../models/MasterAffiliate");
    
    // Find user's affiliate
    const affiliate = await Affiliate.findOne({
      'referredUsers.user': userId,
      status: 'active'
    });
    
    if (!affiliate) {
      return res.json({ success: true, message: "No affiliate found for user" });
    }
    
    // Calculate bet commission
    const betRate = Number(affiliate.commissionRate) || 0;
    const betCommission = amount * betRate;
    
    if (betCommission > 0) {
      await affiliate.addBetCommission(
        userId,
        betId,
        amount,
        betRate,
        `Bet commission - ${gameType}`,
        { betType, gameType, currency: 'BDT' }
      );
    }
    
    // Check for master affiliate
    const master = await MasterAffiliate.findOne({
      'subAffiliates.affiliate': affiliate._id,
      status: 'active'
    });
    
    if (master) {
      const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
      const overrideCommission = betCommission * (overrideRate / 100);
      
      if (overrideCommission > 0) {
        await master.addOverrideCommission(
          overrideCommission,
          affiliate._id,
          'bet_commission',
          betCommission,
          overrideRate,
          'Bet override commission'
        );
      }
    }
    
    res.json({
      success: true,
      message: "Bet commission processed",
      betCommission,
      overrideCommission: overrideCommission || 0
    });
    
  } catch (error) {
    console.error("Bet callback error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
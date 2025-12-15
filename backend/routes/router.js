const express = require("express");
const router = express.Router();
const Affiliate = require("../models/Affiliate");
const MasterAffiliate = require("../models/MasterAffiliate");
const mongoose = require('mongoose');
// 1. REGISTRATION CALLBACK - Handles user registration commissions
// router.get("/postback", async (req, res) => {
//   try {
//     const { cid, status, txid, email, name } = req.query;
    
//     console.log("Registration callback:", { cid, status, txid, email, name });
    
//     if (status !== "success") {
//       return res.json({ success: true, message: "Registration failed" });
//     }
    
//     const Affiliate = require("../models/Affiliate");
//     const MasterAffiliate = require("../models/MasterAffiliate");
//     const User = require("../models/User"); // Assuming you have a User model
    
//     // First, get the registered user details
//     let user = null;
//     try {
//       user = await User.findById(txid); // txid is user ID
//     } catch (error) {
//       console.log("User not found by ID, trying email...");
//       // If txid is not ObjectId, try to find by email
//       if (email) {
//         user = await User.findOne({ email: email });
//       }
//     }
    
//     const userData = {
//       userId: txid, // User ID
//       userEmail: email || (user ? user.email : ''),
//       userName: name || (user ? user.name : '')
//     };
    
//     // Check if master affiliate code
//     const isMaster = cid.toUpperCase().startsWith("MAST");
    
//     if (isMaster) {
//       // Handle master affiliate
//       const master = await MasterAffiliate.findOne({
//         $or: [{ masterCode: cid.toUpperCase() }, { customMasterCode: cid.toUpperCase() }],
//         status: 'active'
//       });
      
//       if (!master) {
//         return res.json({ success: true, message: "Master affiliate not found" });
//       }
      
//       // ✅ COLLECT USER DATA FOR MASTER AFFILIATE
//       await master.addRegisteredUser(txid, userData.userEmail, userData.userName);
      
//       // Find affiliate who created this master
//       const affiliate = await Affiliate.findOne({
//         _id: master.createdBy,
//         status: 'active'
//       });
      
//       // Pay affiliate commission
//       if (affiliate) {
//         const affiliateCpa = Number(affiliate.cpaRate) || 0;
//         if (affiliateCpa > 0) {
//           await affiliate.addRegistrationBonus(
//             txid, txid, affiliateCpa,
//             `Registration via master ${master.fullName}`,
//             { 
//               currency: 'BDT',
//               masterAffiliateId: master._id,
//               masterAffiliateCode: master.masterCode,
//               userEmail: userData.userEmail
//             }
//           );
//         }
//       }
      
//       // Pay master commission
//       const masterCpa = Number(master.cpaRate) || 0;
//       if (masterCpa > 0) {
//         const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
//         const affiliateCpa = Number(affiliate.cpaRate) || 0;

//         await master.addOverrideCommission(
//           masterCpa,
//           affiliate?._id || null,
//           'registration',
//           affiliateCpa || 0,
//           overrideRate,
//           `Registration commission for user: ${userData.userEmail || txid}`,
//           {
//             userId: txid,
//             userEmail: userData.userEmail,
//             userName: userData.userName
//           }
//         );
        
//         // Update master earnings
//         master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
//         await master.save();
//       }
      
//     } else {
//       // Handle regular affiliate
//       const affiliate = await Affiliate.findOne({
//         $or: [{ affiliateCode: cid.toUpperCase() }, { customAffiliateCode: cid.toUpperCase() }],
//         status: 'active'
//       });
      
//       if (!affiliate) {
//         return res.json({ success: true, message: "Affiliate not found" });
//       }
      
//       // Pay affiliate commission
//       const affiliateCpa = Number(affiliate.cpaRate) || 0;
//       if (affiliateCpa > 0) {
//         await affiliate.addRegistrationBonus(
//           txid, txid, affiliateCpa,
//           'New user registration',
//           { 
//             currency: 'BDT',
//             userEmail: userData.userEmail,
//             userName: userData.userName
//           }
//         );
//       }
      
//       // Check for master affiliate
//       const master = await MasterAffiliate.findOne({
//         'subAffiliates.affiliate': affiliate._id,
//         status: 'active'
//       });
      
//       // ✅ COLLECT USER DATA FOR MASTER AFFILIATE (if affiliate has a master)
//       if (master) {
//         await master.addRegisteredUser(txid, userData.userEmail, userData.userName);
        
//         // Pay master commission
//         const masterCpa = Number(master.cpaRate) || 0;
//         if (masterCpa > 0) {
//           const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
//           await master.addOverrideCommission(
//             masterCpa,
//             affiliate._id,
//             'registration',
//             affiliateCpa || 0,
//             overrideRate,
//             `Override from affiliate registration - User: ${userData.userEmail || txid}`,
//             {
//               userId: txid,
//               userEmail: userData.userEmail,
//               userName: userData.userName,
//               affiliateId: affiliate._id,
//               affiliateCode: affiliate.affiliateCode
//             }
//           );
          
//           // Update master earnings
//           master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
//           await master.save();
//         }
//       }
//     }
    
//     res.json({ 
//       success: true, 
//       message: "Registration commission processed",
//       userRegistered: true,
//       userId: txid
//     });
    
//   } catch (error) {
//     console.error("Registration callback error:", error);
//     res.json({ 
//       success: true, 
//       message: "Registration successful, commission processing error",
//       error: error.message 
//     });
//   }
// });


router.get("/postback", async (req, res) => {
  try {
    const { cid, status, txid, email, name } = req.query;
    
    console.log("=== Registration Postback Received ===");
    console.log("Query parameters:", { cid, status, txid, email, name });
    
    // If status is not success, just acknowledge
    if (status !== "success") {
      console.log("Registration failed or pending");
      return res.json({ success: true, message: "Registration not completed" });
    }
    
    // Check required parameters
    if (!cid) {
      console.error("Missing cid parameter");
      return res.json({ success: false, message: "Missing affiliate code" });
    }
    
    if (!txid) {
      console.error("Missing txid parameter");
      return res.json({ success: false, message: "Missing transaction/user ID" });
    }
    
    const Affiliate = require("../models/Affiliate");
    const MasterAffiliate = require("../models/MasterAffiliate");
    const User = require("../models/User");
    const mongoose = require('mongoose');
    
    // ==================== PROCESS USER DATA ====================
    console.log("\n1. Processing user data...");
    let userId = txid;
    let userEmail = email || '';
    let userName = name || '';
    
    // Try to find user in database if we have email but not name
    if (userEmail && !userName) {
      try {
        const user = await User.findOne({ email: userEmail });
        if (user) {
          userId = user._id;
          userName = user.name || user.username || user.firstName || '';
          console.log(`Found user in database: ${userEmail}, ID: ${userId}`);
        }
      } catch (userErr) {
        console.log("Could not find user in database:", userErr.message);
      }
    }
    
    // Validate if userId is a valid ObjectId
    let isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    if (!isValidObjectId) {
      console.log(`User ID ${userId} is not a valid MongoDB ObjectId, storing as string`);
    }
    
    const userData = {
      userId: userId,
      userEmail: userEmail,
      userName: userName
    };
    
    console.log("Final user data:", userData);
    
    // ==================== CHECK AFFILIATE TYPE ====================
    console.log("\n2. Checking affiliate type...");
    const isMaster = cid.toUpperCase().startsWith("MAST");
    console.log(`Code ${cid} is ${isMaster ? 'MASTER' : 'REGULAR'} affiliate code`);
    
    // ==================== HANDLE MASTER AFFILIATE ====================
    if (isMaster) {
      console.log("\n3. Handling MASTER affiliate...");
      
      // Find master affiliate
      const master = await MasterAffiliate.findOne({
        $or: [
          { masterCode: cid.toUpperCase() },
          { customMasterCode: cid.toUpperCase() }
        ],
        status: 'active'
      });
      
      if (!master) {
        console.error(`Master affiliate not found with code: ${cid}`);
        return res.json({ 
          success: false, 
          message: "Master affiliate not found or inactive" 
        });
      }
      
      console.log(`Found master affiliate: ${master.masterCode} (${master.fullName})`);
      
      // ======= COLLECT USER FOR MASTER AFFILIATE =======
      console.log("\n4. Adding user to master affiliate...");
      try {
        const updatedMaster = await master.addRegisteredUser(
          userData.userId, 
          userData.userEmail, 
          userData.userName
        );
        console.log(`✅ User added to master affiliate. Total users: ${updatedMaster.totalRegisteredUsers}`);
      } catch (addUserError) {
        console.error("❌ Error adding user to master:", addUserError.message);
      }
      
      // ======= PAY COMMISSIONS =======
      console.log("\n5. Processing commissions...");
      
      // Find affiliate who created this master
      const superAffiliate = await Affiliate.findOne({
        _id: master.createdBy,
        status: 'active'
      });
      
      // Pay super affiliate commission
      if (superAffiliate) {
        console.log(`Found super affiliate: ${superAffiliate.affiliateCode} (${superAffiliate.fullName})`);
        const affiliateCpa = Number(superAffiliate.cpaRate) || 0;
        
        if (affiliateCpa > 0) {
          try {
            await superAffiliate.addRegistrationBonus(
              txid, 
              txid, 
              affiliateCpa,
              `Registration via master ${master.fullName} (${master.masterCode})`,
              { 
                currency: 'BDT',
                masterAffiliateId: master._id,
                masterAffiliateCode: master.masterCode,
                userEmail: userData.userEmail,
                userName: userData.userName
              }
            );
            console.log(`✅ Paid ${affiliateCpa} CPA to super affiliate`);
          } catch (affiliateError) {
            console.error("❌ Error paying super affiliate:", affiliateError.message);
          }
        }
      }
      
      // Pay master affiliate commission
      const masterCpa = Number(master.cpaRate) || 0;
      if (masterCpa > 0) {
        try {
          const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
          const superAffiliateCpa = superAffiliate ? Number(superAffiliate.cpaRate) || 0 : 0;
          
          await master.addOverrideCommission(
            masterCpa,
            superAffiliate?._id || null,
            'registration',
            superAffiliateCpa || 0,
            overrideRate,
            `Registration commission for user: ${userData.userEmail || userData.userName || txid}`,
            {
              userId: userData.userId,
              userEmail: userData.userEmail,
              userName: userData.userName,
              registrationDate: new Date()
            }
          );
          
          // Update total earnings
          master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
          await master.save();
          
          console.log(`✅ Paid ${masterCpa} CPA to master affiliate`);
        } catch (masterError) {
          console.error("❌ Error paying master affiliate:", masterError.message);
        }
      }
      
    } 
    // ==================== HANDLE REGULAR AFFILIATE ====================
    else {
      console.log("\n3. Handling REGULAR affiliate...");
      
      // Find regular affiliate
      const affiliate = await Affiliate.findOne({
        $or: [
          { affiliateCode: cid.toUpperCase() },
          { customAffiliateCode: cid.toUpperCase() }
        ],
        status: 'active'
      });
      
      if (!affiliate) {
        console.error(`Affiliate not found with code: ${cid}`);
        return res.json({ 
          success: false, 
          message: "Affiliate not found or inactive" 
        });
      }
      
      console.log(`Found affiliate: ${affiliate.affiliateCode} (${affiliate.fullName})`);
      
      // Pay affiliate commission
      const affiliateCpa = Number(affiliate.cpaRate) || 0;
      if (affiliateCpa > 0) {
        try {
          await affiliate.addRegistrationBonus(
            txid, 
            txid, 
            affiliateCpa,
            'New user registration',
            { 
              currency: 'BDT',
              userEmail: userData.userEmail,
              userName: userData.userName,
              registrationDate: new Date()
            }
          );
          console.log(`✅ Paid ${affiliateCpa} CPA to affiliate`);
        } catch (affiliateError) {
          console.error("❌ Error paying affiliate:", affiliateError.message);
        }
      }
      
      // ======= CHECK FOR MASTER AFFILIATE =======
      console.log("\n4. Checking for master affiliate...");
      const master = await MasterAffiliate.findOne({
        'subAffiliates.affiliate': affiliate._id,
        status: 'active'
      });
      
      // ======= COLLECT USER FOR MASTER AFFILIATE =======
      if (master) {
        console.log(`Found master affiliate: ${master.masterCode} (${master.fullName})`);
        
        console.log("\n5. Adding user to master affiliate...");
        try {
          const updatedMaster = await master.addRegisteredUser(
            userData.userId, 
            userData.userEmail, 
            userData.userName
          );
          console.log(`✅ User added to master affiliate. Total users: ${updatedMaster.totalRegisteredUsers}`);
        } catch (addUserError) {
          console.error("❌ Error adding user to master:", addUserError.message);
        }
        
        // Pay master commission
        const masterCpa = Number(master.cpaRate) || 0;
        if (masterCpa > 0) {
          try {
            const overrideRate = Number(master.masterEarnings?.overrideCommission) || 5;
            
            await master.addOverrideCommission(
              masterCpa,
              affiliate._id,
              'registration',
              affiliateCpa || 0,
              overrideRate,
              `Override from affiliate ${affiliate.affiliateCode} - User: ${userData.userEmail || userData.userName || txid}`,
              {
                userId: userData.userId,
                userEmail: userData.userEmail,
                userName: userData.userName,
                affiliateId: affiliate._id,
                affiliateCode: affiliate.affiliateCode,
                registrationDate: new Date()
              }
            );
            
            // Update master earnings
            master.total_earning = (Number(master.total_earning) || 0) + masterCpa;
            await master.save();
            
            console.log(`✅ Paid ${masterCpa} CPA to master affiliate as override`);
          } catch (masterError) {
            console.error("❌ Error paying master affiliate:", masterError.message);
          }
        }
      } else {
        console.log("No master affiliate found for this affiliate");
      }
    }
    
    // ==================== SUCCESS RESPONSE ====================
    console.log("\n=== Registration Postback Completed Successfully ===");
    res.json({ 
      success: true, 
      message: "Registration and commission processing completed",
      userRegistered: true,
      userId: txid,
      affiliateCode: cid,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("\n❌❌❌ CRITICAL ERROR in postback:", error);
    console.error("Error stack:", error.stack);
    
    // Still return success to the tracking system so it doesn't retry
    res.json({ 
      success: true, 
      message: "Registration recorded, commission processing may have issues",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 2. DEPOSIT CALLBACK - Handles deposit commissions
// router.post("/deposit-callback", async (req, res) => {
//   try {
//     const { userId, depositId, amount, method, affiliateCode, type } = req.body;
    
//     console.log("Deposit callback:", { userId, amount, affiliateCode, depositId, type });
//     const depositAmount = Number(amount);
//     const userIdObj = new mongoose.Types.ObjectId(userId);
    
//     // Check if this is a first deposit
//     const isFirstDeposit = type === "first deposit";
    
//     // FIRST: Find master affiliate by affiliate code
//     let masterAffiliate = null;
//     let regularAffiliate = null;
    
//     if (affiliateCode) {
//       // Check if it's a master affiliate code
//       const isMasterCode = affiliateCode.toUpperCase().startsWith("MAST");
      
//       if (isMasterCode) {
//         // Find master affiliate by code
//         masterAffiliate = await MasterAffiliate.findOne({
//           $or: [
//             { masterCode: affiliateCode.toUpperCase() },
//             { customMasterCode: affiliateCode.toUpperCase() }
//           ],
//           status: 'active'
//         });
        
//         if (masterAffiliate) {
//     // ----------------------------first-deposit----------------------------
//           if (isFirstDeposit) {
//             const fixedCommissionAmount = depositAmount;
            
//             if (fixedCommissionAmount > 0) {
//               const validDepositId = new mongoose.Types.ObjectId();
              
//               await masterAffiliate.addCommission(
//                 fixedCommissionAmount,
//                 userIdObj,
//                 validDepositId,
//                 'deposit',
//                 100,
//                 fixedCommissionAmount,
//                 'first_deposit_commission',
//                 `FIRST DEPOSIT commission (fixed amount)`,
//                 { 
//                   viaMasterAffiliate: true,
//                   masterAffiliateCode: affiliateCode,
//                   isFirstDeposit: true,
//                   fixedCommission: true,
//                   depositMethod: method || 'unknown',
//                   currency: 'BDT',
//                   originalDepositId: depositId,
//                   fixedCommissionType: 'full_amount'
//                 }
//               );
//             }
            
//             // Also add this user to master affiliate's referred users if not already
//             if (!masterAffiliate.referredUsers || !Array.isArray(masterAffiliate.referredUsers)) {
//               masterAffiliate.referredUsers = [];
//             }
            
//             const existingUserIndex = masterAffiliate.referredUsers.findIndex(
//               user => user.user && user.user.toString() === userIdObj.toString()
//             );
            
//             if (existingUserIndex === -1) {
//               masterAffiliate.referredUsers.push({
//                 user: userIdObj,
//                 joinedAt: new Date(),
//                 earnedAmount: fixedCommissionAmount,
//                 firstDepositProcessed: true,
//                 firstDepositAmount: depositAmount
//               });
//               await masterAffiliate.save();
//             }
            
//             return res.json({
//               success: true,
//               message: "FIRST DEPOSIT commission processed for master affiliate",
//               commissionAmount: fixedCommissionAmount,
//               commissionType: "first_deposit_master_fixed",
//               isFirstDeposit: true
//             });

//     // ----------------------------first-deposit----------------------------
//           } else {
//             // Not first deposit - proceed with normal commission flow
//             console.log(`Processing regular deposit commission for master affiliate`);
            
//             // SECOND: Find affiliate by createdBy of master affiliate
//             regularAffiliate = await Affiliate.findOne({
//               _id: masterAffiliate.createdBy,
//               status: 'active'
//             });
            
//             if (regularAffiliate) {
//               // Process deposit commission for the affiliate (who created the master)
//               const depositRate = Number(regularAffiliate.depositRate) || 0;
//               let depositCommission = 0;
              
//               if (depositRate > 0) {
//                 const totalcommissionamount=(depositAmount / 100) * regularAffiliate.depositRate;
//                 const masteraffialitecommission=(depositAmount /100) *masterAffiliate.depositRate;
//                 const reminigncommsion=totalcommissionamount-masteraffialitecommission;
//                 depositCommission = reminigncommsion;
                
//                 if (depositCommission > 0) {
//                   const validDepositId = new mongoose.Types.ObjectId();
                  
//                   await regularAffiliate.addCommission(
//                     depositCommission,
//                     userIdObj,
//                     validDepositId,
//                     'deposit',
//                     depositRate,
//                     depositAmount,
//                     'deposit_commission',
//                     `Deposit commission via master ${masterAffiliate.fullName}`,
//                     { 
//                       viaMasterAffiliate: true,
//                       masterAffiliateId: masterAffiliate._id,
//                       masterAffiliateCode: affiliateCode,
//                       depositMethod: method || 'unknown',
//                       currency: 'BDT',
//                       originalDepositId: depositId
//                     }
//                   );
//                 }
//               }
              
//               // Process override commission for master affiliate
//               const overrideRate = Number(masterAffiliate.masterEarnings?.overrideCommission) || 5;
//               const overrideCommission = (depositCommission * overrideRate) / 100;
              
//               if (overrideCommission > 0) {
//                 await masterAffiliate.addOverrideCommission(
//                   overrideCommission,
//                   regularAffiliate._id,
//                   'deposit_commission',
//                   depositCommission,
//                   overrideRate,
//                   `Deposit override commission from ${regularAffiliate.fullName}`
//                 );
//               }
              
//               return res.json({
//                 success: true,
//                 message: "Master affiliate commission processed",
//                 depositCommission,
//                 overrideCommission: overrideCommission || 0,
//                 commissionType: "master_affiliate"
//               });
//             } else {
//               console.log(`No regular affiliate found for master createdBy: ${masterAffiliate.createdBy}`);
//             }
//           }
//         } else {
//           console.log(`No master affiliate found with code: ${affiliateCode}`);
//         }
//       }
//     }
    
//     // THIRD: If no master affiliate found or no regular affiliate created the master,
//     // find regular affiliate directly by referred user
//     const regularAffiliateDirect = await Affiliate.findOne({
//       'referredUsers.user': userIdObj,
//       status: 'active'
//     });
    
//     if (!regularAffiliateDirect) {
//       console.log(`No affiliate found for user: ${userId}`);
//       return res.json({ success: true, message: "No affiliate found for user" });
//     }
    
//     console.log(`Found regular affiliate by referred user: ${regularAffiliateDirect._id}`);
    
//     // Check if this is first deposit for regular affiliate
//     if (isFirstDeposit) {
//       console.log(`Processing FIRST DEPOSIT for regular affiliate`);
      
//       // For regular affiliate first deposit, we also use fixed amount (same as master)
//       const fixedCommissionAmount = depositAmount;
//       const depositRate = Number(regularAffiliateDirect.depositRate) || 0;
//       let firstDepositCommission = 0;
      
//       if (depositRate > 0) {
//         firstDepositCommission = (fixedCommissionAmount * depositRate) / 100;
        
//         if (firstDepositCommission > 0) {
//           const validDepositId = new mongoose.Types.ObjectId();
          
//           await regularAffiliateDirect.addCommission(
//             firstDepositCommission,
//             userIdObj,
//             validDepositId,
//             'deposit',
//             depositRate,
//             fixedCommissionAmount,
//             'deposit_commission',
//             `FIRST DEPOSIT commission`,
//             { 
//               isFirstDeposit: true,
//               fixedCommissionType: 'regular_first_deposit',
//               depositMethod: method || 'unknown',
//               currency: 'BDT',
//               originalDepositId: depositId
//             }
//           );
//         }
//       }
      
//       // FOURTH: Check for master affiliate who has this affiliate as sub-affiliate
//       const masterOfAffiliate = await MasterAffiliate.findOne({
//         'subAffiliates.affiliate': regularAffiliateDirect._id,
//         status: 'active'
//       });
      
//       if (masterOfAffiliate) {
//         console.log(`Found master affiliate for regular affiliate: ${masterOfAffiliate._id}`);
        
//         // For first deposit, master gets fixed commission too
//         const masterFixedCommission = fixedCommissionAmount;
//         let masterCommission = 0;
        
//         if (masterFixedCommission > 0) {
//           const validDepositId = new mongoose.Types.ObjectId();
          
//           await masterOfAffiliate.addCommission(
//             masterFixedCommission,
//             userIdObj,
//             validDepositId,
//             'deposit',
//             100,
//             masterFixedCommission,
//             'first_deposit_commission',
//             `FIRST DEPOSIT override commission from ${regularAffiliateDirect.fullName}`,
//             { 
//               subAffiliateId: regularAffiliateDirect._id,
//               isFirstDeposit: true,
//               fixedCommissionType: 'master_override_first_deposit',
//               depositMethod: method || 'unknown',
//               currency: 'BDT',
//               originalDepositId: depositId,
//               fixedCommission: true
//             }
//           );
          
//           masterCommission = masterFixedCommission;
//         }
        
//         return res.json({
//           success: true,
//           message: "First deposit commission processed with master affiliate",
//           depositCommission: firstDepositCommission,
//           masterCommission: masterCommission || 0,
//           commissionType: "first_deposit_with_master"
//         });
//       }
      
//       return res.json({
//         success: true,
//         message: "First deposit commission processed (regular affiliate only)",
//         depositCommission: firstDepositCommission,
//         masterCommission: 0,
//         commissionType: "first_deposit_regular_only"
//       });
//     } else {
//       // Not first deposit - normal commission flow for regular affiliate
//       console.log(`Processing regular deposit commission for regular affiliate`);
      
//       // Calculate deposit commission for regular affiliate
//       const depositRate = Number(regularAffiliateDirect.depositRate) || 0;
//       let depositCommission = 0;
      
//       if (depositRate > 0) {
//         depositCommission = (depositAmount * depositRate) / 100;
        
//         if (depositCommission > 0) {
//           const validDepositId = new mongoose.Types.ObjectId();
          
//           await regularAffiliateDirect.addCommission(
//             depositCommission,
//             userIdObj,
//             validDepositId,
//             'deposit',
//             depositRate,
//             depositAmount,
//             'deposit_commission',
//             `Deposit commission`,
//             { 
//               depositMethod: method || 'unknown',
//               currency: 'BDT',
//               originalDepositId: depositId
//             }
//           );
//         }
//       }
      
//       // FOURTH: Check for master affiliate who has this affiliate as sub-affiliate
//       const masterOfAffiliate = await MasterAffiliate.findOne({
//         'subAffiliates.affiliate': regularAffiliateDirect._id,
//         status: 'active'
//       });
      
//       if (masterOfAffiliate) {
//         console.log(`Found master affiliate for regular affiliate: ${masterOfAffiliate._id}`);
        
//         const overrideRate = Number(masterOfAffiliate.masterEarnings?.overrideCommission) || 5;
//         const overrideCommission = (depositCommission * overrideRate) / 100;
        
//         if (overrideCommission > 0) {
//           await masterOfAffiliate.addOverrideCommission(
//             overrideCommission,
//             regularAffiliateDirect._id,
//             'deposit_commission',
//             depositCommission,
//             overrideRate,
//             `Deposit override commission from ${regularAffiliateDirect.fullName}`
//           );
//         }
        
//         return res.json({
//           success: true,
//           message: "Deposit commission processed with master affiliate override",
//           depositCommission,
//           overrideCommission: overrideCommission || 0,
//           commissionType: "regular_affiliate_with_master"
//         });
//       } else {
//         console.log(`No master affiliate found for regular affiliate: ${regularAffiliateDirect._id}`);
//       }
      
//       res.json({
//         success: true,
//         message: "Deposit commission processed (regular affiliate only)",
//         depositCommission,
//         overrideCommission: 0,
//         commissionType: "regular_affiliate_only"
//       });
//     }
    
//   } catch (error) {
//     console.error("Deposit callback error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });






// router.post("/deposit-callback", async (req, res) => {
//   try {
//     const { userId, depositId, amount, method, affiliateCode, type } = req.body;
    
//     console.log("Deposit callback:", { userId, amount, affiliateCode, depositId, type });
//     const depositAmount = Number(amount);
//     const userIdObj = new mongoose.Types.ObjectId(userId);
    
//     // Check if this is a first deposit
//     const isFirstDeposit = type === "first deposit";
    
//     // FIRST: Find master affiliate by affiliate code
//     let masterAffiliate = null;
//     let regularAffiliate = null;
    
//     if (affiliateCode) {
//       // Check if it's a master affiliate code
//       const isMasterCode = affiliateCode.toUpperCase().startsWith("MAST");
      
//       if (isMasterCode) {
//         // Find master affiliate by code
//         masterAffiliate = await MasterAffiliate.findOne({
//           $or: [
//             { masterCode: affiliateCode.toUpperCase() },
//             { customMasterCode: affiliateCode.toUpperCase() }
//           ],
//           status: 'active'
//         });
        
//         if (masterAffiliate) {
//           // Check if user exists in registeredUsers and claimedStatus is "claimed"
//           let userRegistered = false;
//           let userClaimedStatus = "unclaimed";
          
//           if (masterAffiliate.registeredUsers && Array.isArray(masterAffiliate.registeredUsers)) {
//             const registeredUser = masterAffiliate.registeredUsers.find(
//               user => user.userId && user.userId.toString() === userIdObj.toString()
//             );
            
//             if (registeredUser) {
//               userRegistered = true;
//               userClaimedStatus = registeredUser.claimedStatus || "unclaimed";
              
//               // If claimedStatus is "claimed", don't process commission and return early
//               if (userClaimedStatus === "claimed") {
//                 console.log(`User ${userId} has already been claimed. Skipping commission processing.`);
//                 return res.json({
//                   success: true,
//                   message: "User already claimed. No commission processed.",
//                   claimedStatus: "claimed",
//                   commissionProcessed: false
//                 });
//               }
              
//               // If claimedStatus is "unclaimed", update it to "claimed" for future deposits
//               if (userClaimedStatus === "unclaimed") {
//                 // Find the user in the array and update claimedStatus
//                 const userIndex = masterAffiliate.registeredUsers.findIndex(
//                   user => user.userId && user.userId.toString() === userIdObj.toString()
//                 );
                
//                 if (userIndex !== -1) {
//                   masterAffiliate.registeredUsers[userIndex].claimedStatus = "claimed";
//                   await masterAffiliate.save();
//                   console.log(`Updated claimedStatus to "claimed" for user ${userId}`);
//                 }
//               }
//             }
//           }
          
//           // ----------------------------first-deposit----------------------------
//           if (isFirstDeposit) {
//             const fixedCommissionAmount = depositAmount;
            
//             if (fixedCommissionAmount > 0) {
//               const validDepositId = new mongoose.Types.ObjectId();
              
//               await masterAffiliate.addCommission(
//                 fixedCommissionAmount,
//                 userIdObj,
//                 validDepositId,
//                 'deposit',
//                 100,
//                 fixedCommissionAmount,
//                 'first_deposit_commission',
//                 `FIRST DEPOSIT commission (fixed amount)`,
//                 { 
//                   viaMasterAffiliate: true,
//                   masterAffiliateCode: affiliateCode,
//                   isFirstDeposit: true,
//                   fixedCommission: true,
//                   depositMethod: method || 'unknown',
//                   currency: 'BDT',
//                   originalDepositId: depositId,
//                   fixedCommissionType: 'full_amount',
//                   registeredUser: userRegistered,
//                   claimedStatus: userClaimedStatus
//                 }
//               );
//             }
            
//             // Also add this user to master affiliate's referredUsers if not already
//             if (!masterAffiliate.referredUsers || !Array.isArray(masterAffiliate.referredUsers)) {
//               masterAffiliate.referredUsers = [];
//             }
            
//             const existingUserIndex = masterAffiliate.referredUsers.findIndex(
//               user => user.user && user.user.toString() === userIdObj.toString()
//             );
            
//             if (existingUserIndex === -1) {
//               masterAffiliate.referredUsers.push({
//                 user: userIdObj,
//                 joinedAt: new Date(),
//                 earnedAmount: fixedCommissionAmount,
//                 firstDepositProcessed: true,
//                 firstDepositAmount: depositAmount
//               });
//               await masterAffiliate.save();
//             }
            
//             return res.json({
//               success: true,
//               message: "FIRST DEPOSIT commission processed for master affiliate",
//               commissionAmount: fixedCommissionAmount,
//               commissionType: "first_deposit_master_fixed",
//               isFirstDeposit: true,
//               registeredUser: userRegistered,
//               claimedStatus: userClaimedStatus
//             });

//           // ----------------------------first-deposit----------------------------
//           } else {
//             // Not first deposit - proceed with normal commission flow
//             console.log(`Processing regular deposit commission for master affiliate`);
            
//             // SECOND: Find affiliate by createdBy of master affiliate
//             regularAffiliate = await Affiliate.findOne({
//               _id: masterAffiliate.createdBy,
//               status: 'active'
//             });
            
//             if (regularAffiliate) {
//               // Process deposit commission for the affiliate (who created the master)
//               const depositRate = Number(regularAffiliate.depositRate) || 0;
//               let depositCommission = 0;
              
//               if (depositRate > 0) {
//                 const totalcommissionamount = (depositAmount / 100) * regularAffiliate.depositRate;
//                 console.log("totalcommissionamount", totalcommissionamount);
//                 const masteraffialitecommission = (totalcommissionamount / 100) * masterAffiliate.depositRate;
//                 console.log("masteraffialitecommission", masteraffialitecommission);
//                 const reminigncommsion = totalcommissionamount - masteraffialitecommission;
//                 console.log("reminigncommsion", reminigncommsion);

//                 depositCommission = reminigncommsion;
                
//                 if (depositCommission > 0) {
//                   const validDepositId = new mongoose.Types.ObjectId();
                  
//                   await regularAffiliate.addCommission(
//                     depositCommission,
//                     userIdObj,
//                     validDepositId,
//                     'deposit',
//                     depositRate,
//                     depositAmount,
//                     'deposit_commission',
//                     `Deposit commission via master ${masterAffiliate.fullName}`,
//                     { 
//                       viaMasterAffiliate: true,
//                       masterAffiliateId: masterAffiliate._id,
//                       masterAffiliateCode: affiliateCode,
//                       depositMethod: method || 'unknown',
//                       currency: 'BDT',
//                       originalDepositId: depositId,
//                       registeredUser: userRegistered,
//                       claimedStatus: userClaimedStatus
//                     }
//                   );
//                 }
//               }
              
//               // Process override commission for master affiliate
//               const totalcommissionamount = (depositAmount / 100) * regularAffiliate.depositRate;
//               console.log("totalcommissionamount", totalcommissionamount);
//               const masteraffialitecommission = (totalcommissionamount / 100) * masterAffiliate.depositRate;
//               console.log("masteraffialitecommission", masteraffialitecommission);
//               const reminigncommsion = totalcommissionamount - masteraffialitecommission;
//               console.log("reminigncommsion", reminigncommsion);
              
//               const overrideRate = Number(masterAffiliate.masterEarnings?.overrideCommission) || 5;
//               const overrideCommission = masteraffialitecommission;
              
//               if (overrideCommission > 0) {
//                 await masterAffiliate.addOverrideCommission(
//                   overrideCommission,
//                   regularAffiliate._id,
//                   'deposit_commission',
//                   depositCommission,
//                   overrideRate,
//                   `Deposit override commission from ${regularAffiliate.fullName}`,
//                   { 
//                     registeredUser: userRegistered,
//                     claimedStatus: userClaimedStatus
//                   }
//                 );
//               }
              
//               return res.json({
//                 success: true,
//                 message: "Master affiliate commission processed",
//                 depositCommission,
//                 overrideCommission: overrideCommission || 0,
//                 commissionType: "master_affiliate",
//                 registeredUser: userRegistered,
//                 claimedStatus: userClaimedStatus
//               });
//             } else {
//               console.log(`No regular affiliate found for master createdBy: ${masterAffiliate.createdBy}`);
//             }
//           }
//         } else {
//           console.log(`No master affiliate found with code: ${affiliateCode}`);
//         }
//       }
//     }
    
//   } catch (error) {
//     console.error("Deposit callback error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });


router.post("/deposit-callback", async (req, res) => {
  try {
    const { userId, depositId, amount, method, affiliateCode, type } = req.body;
    
    console.log("Deposit callback:", { userId, amount, affiliateCode, depositId, type });
    const depositAmount = Number(amount);
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Check if this is a first deposit
    const isFirstDeposit = type === "first deposit";
    
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
          // Check if user exists in registeredUsers and their claimedStatus
          let userRegistered = false;
          let userClaimedStatus = "unclaimed";
          let skipCommission = false;
          
          if (masterAffiliate.registeredUsers && Array.isArray(masterAffiliate.registeredUsers)) {
            const registeredUserIndex = masterAffiliate.registeredUsers.findIndex(
              user => user.userId && user.userId.toString() === userIdObj.toString()
            );
            
            if (registeredUserIndex !== -1) {
              userRegistered = true;
              userClaimedStatus = masterAffiliate.registeredUsers[registeredUserIndex].claimedStatus || "unclaimed";
              
              // Update claimedStatus based on current value
              if (userClaimedStatus === "claimed") {
                // Skip commission processing but update to "unclaimed" for next time
                skipCommission = true;
                masterAffiliate.registeredUsers[registeredUserIndex].claimedStatus = "unclaimed";
                console.log(`User ${userId} was claimed. Skipping commission and setting to unclaimed for next time.`);
              }
              
              await masterAffiliate.save();
            }
          }
          
          // If we should skip commission, return early
          if (skipCommission) {
            return res.json({
              success: true,
              message: "Commission skipped - user was previously claimed. Status set to unclaimed for next deposit.",
              claimedStatus: "unclaimed", // Now it's unclaimed for next time
              commissionProcessed: false,
              skipReason: "user_previously_claimed"
            });
          }
          
          // ----------------------------first-deposit----------------------------
          if (isFirstDeposit) {
            const fixedCommissionAmount = depositAmount;
            
            if (fixedCommissionAmount > 0) {
              const validDepositId = new mongoose.Types.ObjectId();
              
              await masterAffiliate.addCommission(
                fixedCommissionAmount,
                userIdObj,
                validDepositId,
                'deposit',
                100,
                fixedCommissionAmount,
                'first_deposit_commission',
                `FIRST DEPOSIT commission (fixed amount)`,
                { 
                  viaMasterAffiliate: true,
                  masterAffiliateCode: affiliateCode,
                  isFirstDeposit: true,
                  fixedCommission: true,
                  depositMethod: method || 'unknown',
                  currency: 'BDT',
                  originalDepositId: depositId,
                  fixedCommissionType: 'full_amount',
                  registeredUser: userRegistered,
                  claimedStatus: userClaimedStatus,
                  claimedStatusUpdated: userRegistered // True if we updated the status
                }
              );
            }
            
            // Also add this user to master affiliate's referredUsers if not already
            if (!masterAffiliate.referredUsers || !Array.isArray(masterAffiliate.referredUsers)) {
              masterAffiliate.referredUsers = [];
            }
            
            const existingUserIndex = masterAffiliate.referredUsers.findIndex(
              user => user.user && user.user.toString() === userIdObj.toString()
            );
            
            if (existingUserIndex === -1) {
              masterAffiliate.referredUsers.push({
                user: userIdObj,
                joinedAt: new Date(),
                earnedAmount: fixedCommissionAmount,
                firstDepositProcessed: true,
                firstDepositAmount: depositAmount
              });
              await masterAffiliate.save();
            }
            
            return res.json({
              success: true,
              message: "FIRST DEPOSIT commission processed for master affiliate",
              commissionAmount: fixedCommissionAmount,
              commissionType: "first_deposit_master_fixed",
              isFirstDeposit: true,
              registeredUser: userRegistered,
              claimedStatus: userClaimedStatus,
              claimedStatusUpdated: userRegistered ? "unclaimed → claimed" : "not_registered"
            });

          // ----------------------------first-deposit----------------------------
          } else {
            // Not first deposit - proceed with normal commission flow
            console.log(`Processing regular deposit commission for master affiliate`);
            
            // SECOND: Find affiliate by createdBy of master affiliate
            regularAffiliate = await Affiliate.findOne({
              _id: masterAffiliate.createdBy,
              status: 'active'
            });
            
            if (regularAffiliate) {
              // Process deposit commission for the affiliate (who created the master)
              const depositRate = Number(regularAffiliate.depositRate) || 0;
              let depositCommission = 0;
              
              if (depositRate > 0) {
                const totalcommissionamount = (depositAmount / 100) * regularAffiliate.depositRate;
                console.log("totalcommissionamount", totalcommissionamount);
                const masteraffialitecommission = (totalcommissionamount / 100) * masterAffiliate.depositRate;
                console.log("masteraffialitecommission", masteraffialitecommission);
                const reminigncommsion = totalcommissionamount - masteraffialitecommission;
                console.log("reminigncommsion", reminigncommsion);

                depositCommission = reminigncommsion;
                
                if (depositCommission > 0) {
                  const validDepositId = new mongoose.Types.ObjectId();
                  
                  await regularAffiliate.addCommission(
                    depositCommission,
                    userIdObj,
                    validDepositId,
                    'deposit',
                    depositRate,
                    depositAmount,
                    'deposit_commission',
                    `Deposit commission via master ${masterAffiliate.fullName}`,
                    { 
                      viaMasterAffiliate: true,
                      masterAffiliateId: masterAffiliate._id,
                      masterAffiliateCode: affiliateCode,
                      depositMethod: method || 'unknown',
                      currency: 'BDT',
                      originalDepositId: depositId,
                      registeredUser: userRegistered,
                      claimedStatus: userClaimedStatus,
                      claimedStatusUpdated: userRegistered ? "unclaimed → claimed" : "not_registered"
                    }
                  );
                }
              }
              
              // Process override commission for master affiliate
              const totalcommissionamount = (depositAmount / 100) * regularAffiliate.depositRate;
              console.log("totalcommissionamount", totalcommissionamount);
              const masteraffialitecommission = (totalcommissionamount / 100) * masterAffiliate.depositRate;
              console.log("masteraffialitecommission", masteraffialitecommission);
              const reminigncommsion = totalcommissionamount - masteraffialitecommission;
              console.log("reminigncommsion", reminigncommsion);
              
              const overrideRate = Number(masterAffiliate.masterEarnings?.overrideCommission) || 5;
              const overrideCommission = masteraffialitecommission;
              
              if (overrideCommission > 0) {
                await masterAffiliate.addOverrideCommission(
                  overrideCommission,
                  regularAffiliate._id,
                  'deposit_commission',
                  depositCommission,
                  overrideRate,
                  `Deposit override commission from ${regularAffiliate.fullName}`,
                  { 
                    registeredUser: userRegistered,
                    claimedStatus: userClaimedStatus,
                    claimedStatusUpdated: userRegistered ? "unclaimed → claimed" : "not_registered"
                  }
                );
              }
              
              return res.json({
                success: true,
                message: "Master affiliate commission processed",
                depositCommission,
                overrideCommission: overrideCommission || 0,
                commissionType: "master_affiliate",
                registeredUser: userRegistered,
                claimedStatus: userClaimedStatus,
                claimedStatusUpdated: userRegistered ? "unclaimed → claimed" : "not_registered"
              });
            } else {
              console.log(`No regular affiliate found for master createdBy: ${masterAffiliate.createdBy}`);
            }
          }
        } else {
          console.log(`No master affiliate found with code: ${affiliateCode}`);
        }
      }
    }
    
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
import express from "express";
import {
  PublicKey,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  BaseFeeMode,
  DynamicBondingCurveClient,
  buildCurve,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN } from "bn.js";
import dotenv from "dotenv";
dotenv.config();
import bs58 from "bs58";

const router = express.Router();

/////////////////////////// Helper Functions ///////////////////////////

// Initialize connection
const rpcUrl = process.env.RPC_URL;
const connection = new Connection(rpcUrl, "confirmed");
const client = new DynamicBondingCurveClient(connection, "confirmed");

// Function to create config (adapted from createConfig.js)
async function createConfig(wallet, payerPublicKey, quoteThreshold) {
  console.log("Creating config...");
  try {
    // Generate config keypair
    let config = Keypair.generate();
    console.log("Created config:", config.publicKey.toBase58());

    // Build the curve configuration
    const curveConfig = buildCurve({
      totalTokenSupply: 1000000000, // 1B Meme token generation
      percentageSupplyOnMigration: 10,
      migrationQuoteThreshold: quoteThreshold,
      migrationOption: 1, // Option 1: DAMM V2
      tokenBaseDecimal: 9, // 9 DECIMALS FOR MEME COIN
      tokenQuoteDecimal: 9, // 9 DECIMALS FOR STORIES COIN
      lockedVestingParam: {
        totalLockedVestingAmount: 0,
        numberOfVestingPeriod: 0,
        cliffUnlockAmount: 0,
        totalVestingDuration: 0,
        cliffDurationFromMigrationTime: 0,
      },
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: 100,
          endingFeeBps: 100,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: true,
      activationType: 0,
      collectFeeMode: 0, // 0: Quote Token
      migrationFeeOption: 3, // 3: Fixed 200bps
      tokenType: 1, // Token2022
      partnerLpPercentage: 0,
      creatorLpPercentage: 0,
      partnerLockedLpPercentage: 50,
      creatorLockedLpPercentage: 50,
      creatorTradingFeePercentage: 1,
      leftover: 0,
      tokenUpdateAuthority: 1,
      migrationFee: {
        feePercentage: 0,
        creatorFeePercentage: 0,
      },
    });

    const configSetup = await client.partner.createConfig({
      config: config.publicKey,
      feeClaimer: payerPublicKey,
      leftoverReceiver: payerPublicKey,
      payer: wallet.publicKey,
      quoteMint: new PublicKey("So11111111111111111111111111111111111111112"),
      ...curveConfig,
    });
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    configSetup.recentBlockhash = blockhash;
    // Should be always the wallet who's sending the transaction and paying the gas fee
    configSetup.feePayer = wallet.publicKey;
    // Sign the transaction with both the wallet and config keypair
    configSetup.partialSign(wallet);
    configSetup.partialSign(config);
    // Send and confirm the transaction with better options
    const signature = await sendAndConfirmTransaction(
      connection,
      configSetup,
      [wallet, config], // These signers will sign the transaction
      {
        commitment: "confirmed",
        skipPreflight: false, // Changed to false for better error messages
        maxRetries: 3,
      }
    );

    console.log(
      "Config created successfully, transaction signature:",
      signature
    );

    return {
      configAddress: config.publicKey.toString(),
      transactionSignature: signature,
      success: true,
    };
  } catch (error) {
    console.error("Error creating config:", error);
    throw error;
  }
}

// Function to create pool (adapted from createPool.js)
async function createPool(wallet, configAddress, poolData) {
  console.log("Intializing Pool...");
  try {
    const baseMint = Keypair.generate();
    console.log(`Generated base mint: ${baseMint.publicKey.toString()}`);

    console.log("Pool data:", poolData);
    const createPoolParam = {
      baseMint: baseMint.publicKey,
      config: new PublicKey(configAddress),
      name: poolData.name,
      symbol: poolData.symbol,
      uri: poolData.uri,
      payer: wallet.publicKey,
      poolCreator: wallet.publicKey,
    };

    console.log("Creating pool transaction...");
    const poolTransaction = await client.pool.createPool(createPoolParam);

    const signature = await sendAndConfirmTransaction(
      connection,
      poolTransaction,
      [wallet, baseMint, wallet],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );

    return {
      transactionSignature: signature,
      success: true,
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
}

// POST /api/pool/create - Create both config and pool
router.post("/create", async (req, res) => {
  console.log("Creating config and pool...");
  try {
    const { feeclaimer, quoteThreshold, poolData } = req.body;

    if (!feeclaimer) {
      return res.status(400).json({
        error: "Missing required field: payer",
      });
    }
    if (!quoteThreshold) {
      return res.status(400).json({
        error: "Missing required field: quoteThreshold",
      });
    }

    const privateKey = process.env.PRIVATE_KEY;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: "Missing required field: privateKey",
      });
    }

    // Create wallet from private key
    const keypairData = bs58.decode(privateKey);
    const secretKey = Uint8Array.from(keypairData);
    const wallet = Keypair.fromSecretKey(secretKey);

    // Validate and create payer public key
    let userPublicKey;
    try {
      userPublicKey = new PublicKey(feeclaimer);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid payer address format",
        message: "Please provide a valid Solana public key for payer",
      });
    }

    // Step 1: Create config
    const intialBalance = await connection.getBalance(wallet.publicKey);
    console.log("Step 1: Creating config...");
    const configResult = await createConfig(
      wallet,
      userPublicKey,
      quoteThreshold
    );

    console.log("Pool Data:", poolData);

    try {
      if (!poolData.uri) {
        throw new Error("URI is required");
      }
      if (!poolData.name) {
        throw new Error("Name is required");
      }
      if (!poolData.symbol) {
        throw new Error("Symbol is required");
      }
    } catch (error) {
      throw new Error(error.message);
    }

    // Step 2: Create pool using the new config
    console.log("Step 2: Creating pool...");
    const poolResult = await createPool(
      wallet,
      configResult.configAddress,
      poolData
    );

    const finalBalance = await connection.getBalance(wallet.publicKey);
    console.log("Final balance:", finalBalance);
    console.log(
      "Sol Spent:",
      (intialBalance - finalBalance) / LAMPORTS_PER_SOL
    );

    const cluster = process.env.CLUSTER;
    let explorerConfigUrl, explorerPoolUrl;
    if (cluster.toLowerCase() === "devnet") {
      explorerConfigUrl = `https://solscan.io/tx/${configResult.transactionSignature}?cluster=devnet`;
      explorerPoolUrl = `https://solscan.io/tx/${poolResult.transactionSignature}?cluster=devnet`;
    } else if (cluster.toLowerCase() === "mainnet") {
      explorerConfigUrl = `https://solscan.io/tx/${configResult.transactionSignature}?cluster=mainnet`;
      explorerPoolUrl = `https://solscan.io/tx/${poolResult.transactionSignature}?cluster=mainnet`;
    } else {
      throw new Error("Invalid cluster");
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Config and pool created successfully",
      data: {
        wallet: wallet.publicKey.toBase58(),
        feeclaimer: userPublicKey.toBase58(),
        cluster: cluster.toString(),
        config: {
          config_address: configResult.configAddress,
          transactionSignature: configResult.transactionSignature,
          explorerUrl: explorerConfigUrl,
        },
        pool: {
          transactionSignature: poolResult.transactionSignature,
          explorerUrl: explorerPoolUrl,
        },
        solSpent: (intialBalance - finalBalance) / LAMPORTS_PER_SOL,
      },
    });
  } catch (error) {
    console.error("Failed to create config and pool:", error);
    res.status(500).json({
      error: "Failed to create config and pool",
      message: error.message,
      details: error.toString(),
    });
  }
});

export default router;

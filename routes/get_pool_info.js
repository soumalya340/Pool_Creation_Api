import express from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

// Initialize connection
const rpcUrl = process.env.RPC_URL;
const connection = new Connection(rpcUrl, "confirmed");

const client = new DynamicBondingCurveClient(connection, "confirmed");


// GET /api/pool/inf/poolProgression/:configAddress - Get progress for a specific config address
router.get("/info/poolProgression/:configAddress", async (req, res) => {
  try {
    const { configAddress } = req.params;

    // Validate pool address
    if (!configAddress) {
      return res.status(400).json({
        error: "Missing required parameter: poolAddress",
      });
    }
    // Validate that it's a valid Solana public key
    try {
      new PublicKey(configAddress);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid pool address format",
        message: "Please provide a valid Solana public key",
      });
    }

    // Get Pool Address and It's Progress
    console.log("Getting Pool Address and It's Progress......");
    const pools = await client.state.getPoolsByConfig(configAddress);

    const pool = pools[0];

    console.log("Pool Address", pool.publicKey.toBase58());

    const progress = await client.state.getPoolCurveProgress(pool.publicKey);

    console.log("The Progress rate :", progress);

    // Convert decimal to percentage (0-1 becomes 0%-100%)
    const progressInPercent = progress * 100;
    console.log(
      "The Progress rate in percent :",
      progressInPercent.toFixed(4) + "%"
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: "Pool progress retrieved successfully",
      data: {
        pool: {
          address: pool.publicKey.toBase58(),
          progress: {
            progress: progress,
            progressInPercent: `${progressInPercent.toFixed(4)}%`,
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to get pool progress:", error);
    res.status(500).json({
      error: "Failed to get pool progress",
      message: error.message,
      details: error.toString(),
    });
  }
});

export default router;

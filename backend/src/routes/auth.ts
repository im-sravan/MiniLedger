
import { Router } from "express";
import { randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const router = Router();
const jwtSecret = process.env.JWT_SECRET!;

const otpTtlMinutes = Number(process.env.OTP_TTL_MINUTES ?? "5");
if (!Number.isInteger(otpTtlMinutes) || otpTtlMinutes < 1 || otpTtlMinutes > 15) {
  throw new Error("OTP_TTL_MINUTES must be between 1 and 15");
}

const otpSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
});

const verifySchema = otpSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "OTP must contain six digits")
});

type OtpEntry = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const pendingOtps = new Map<string, OtpEntry>();
const cooldowns = new Map<string, number>();

// Demo-only in-memory OTP storage. Restarting the backend clears it.
router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const { phone } = otpSchema.parse(req.body);
    const now = Date.now();
    const cooldownUntil = cooldowns.get(phone) ?? 0;

    if (now < cooldownUntil) {
      throw new AppError(429, "Please wait before requesting another OTP");
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

    pendingOtps.set(phone, {
      code,
      expiresAt: now + otpTtlMinutes * 60_000,
      attempts: 0
    });

    // A short cooldown limits accidental repeated requests.
    cooldowns.set(phone, now + 30_000);

    console.log(`[MiniLedger DEV OTP] Phone: ${phone} | OTP: ${code}`);

    res.status(200).json({
      message: "If the number is valid, a development OTP has been generated."
    });
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const { phone, otp } = verifySchema.parse(req.body);
    const entry = pendingOtps.get(phone);

    if (!entry || Date.now() >= entry.expiresAt) {
      pendingOtps.delete(phone);
      throw new AppError(400, "OTP is missing or expired. Request a new one.");
    }

    entry.attempts += 1;

    if (entry.attempts > 5) {
      pendingOtps.delete(phone);
      throw new AppError(429, "Too many incorrect attempts. Request a new OTP.");
    }

    if (entry.code !== otp) {
      throw new AppError(400, "Incorrect OTP");
    }

    // Consume the OTP before completing authentication.
    pendingOtps.delete(phone);
    cooldowns.delete(phone);

    const result = await pool.query<{ id: string; phone: string }>(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone)
       DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id::text, phone`,
      [phone]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { phone: user.phone },
      jwtSecret,
      { subject: user.id, expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone
      }
    });
  })
);

export default router;

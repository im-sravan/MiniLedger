
import { Router } from "express";
import { pool } from "../db";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(amount), 0)::numeric(14,2)::text AS "totalLent",
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = TRUE), 0)::numeric(14,2)::text AS "totalRepaid",
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = FALSE), 0)::numeric(14,2)::text AS "outstandingAmount",
         COALESCE(SUM(amount) FILTER (
           WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
         ), 0)::numeric(14,2)::text AS "overdueAmount",
         COUNT(*)::int AS "loanCount",
         COUNT(*) FILTER (WHERE is_repaid = FALSE)::int AS "unpaidCount",
         COUNT(*) FILTER (
           WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
         )::int AS "overdueCount"
       FROM loans
       WHERE user_id = $1`,
      [req.user!.id]
    );

    res.json({ summary: result.rows[0] });
  })
);

export default router;

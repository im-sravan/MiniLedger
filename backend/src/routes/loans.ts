
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";

const router = Router();

router.use(authenticate);

const createLoanSchema = z.object({
  friendName: z.string().trim().min(1).max(100),
  amount: z.union([
    z.number(),
    z.string().regex(/^\d+(\.\d{1,2})?$/)
  ]).transform(Number).refine(
    (amount) => Number.isFinite(amount) && amount > 0 && amount <= 9999999999.99,
    "Amount must be positive and within the supported limit"
  ),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
    .refine((date) => {
      const parsed = new Date(`${date}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
    }, "Invalid calendar date")
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { friendName, amount, dueDate } = createLoanSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, friend_name AS "friendName",
                 amount::text AS amount, due_date AS "dueDate",
                 is_repaid AS "isRepaid", repaid_at AS "repaidAt",
                 created_at AS "createdAt"`,
      [userId, friendName, amount.toFixed(2), dueDate]
    );

    res.status(201).json({ loan: result.rows[0] });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT id, friend_name AS "friendName",
              amount::text AS amount, due_date AS "dueDate",
              is_repaid AS "isRepaid", repaid_at AS "repaidAt",
              created_at AS "createdAt",
              (is_repaid = FALSE AND due_date < CURRENT_DATE) AS overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ loans: result.rows });
  })
);

router.patch(
  "/:id/repay",
  asyncHandler(async (req, res) => {
    const id = z.string().regex(/^[1-9]\d*$/).parse(req.params.id);
    const userId = req.user!.id;

    const result = await pool.query(
      `UPDATE loans
       SET is_repaid = TRUE, repaid_at = NOW()
       WHERE id = $1
         AND user_id = $2
         AND is_repaid = FALSE
       RETURNING id, friend_name AS "friendName",
                 amount::text AS amount, due_date AS "dueDate",
                 is_repaid AS "isRepaid", repaid_at AS "repaidAt"`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      const exists = await pool.query(
        "SELECT is_repaid FROM loans WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (exists.rowCount === 0) {
        throw new AppError(404, "Loan not found");
      }

      throw new AppError(409, "Loan has already been repaid");
    }

    res.json({ loan: result.rows[0] });
  })
);

export default router;

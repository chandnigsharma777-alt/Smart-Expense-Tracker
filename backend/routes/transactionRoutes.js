
import express from "express";
import Transaction from "../models/Tran.js";

import {
    getTransactions,
    addTransaction,
    deleteTransaction
} from "../controllers/transactionController.js";

const router = express.Router();

// GET API - View all transactions
router.get("/", getTransactions);

// POST API - Add transaction
router.post("/", addTransaction);

// PUT API - Update transaction
router.put("/:id", async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.json({
            message: "Transaction updated successfully",
            updatedTransaction
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// DELETE API - Delete transaction
router.delete("/:id", deleteTransaction);

export default router;


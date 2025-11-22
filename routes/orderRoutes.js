const express = require("express");
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  seedOrders,
  getDashboardStats,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", getOrders);
router.get("/dashboard/stats", getDashboardStats);
router.post("/", createOrder);
router.post("/seed", seedOrders);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;


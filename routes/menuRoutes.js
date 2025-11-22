const express = require("express");
const {
  getMenu,
  getMenuItem,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

const router = express.Router();

// Public routes
router.get("/", getMenu);
router.get("/:id", getMenuItem);

// Admin routes (CRUD operations)
router.get("/admin/all", getAllMenuItems);
router.post("/admin", createMenuItem);
router.patch("/admin/:id", updateMenuItem);
router.delete("/admin/:id", deleteMenuItem);

module.exports = router;


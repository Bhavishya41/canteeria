const mongoose = require("mongoose");

const LineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    notes: { type: String },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    tokenNumber: { type: Number },
    tableNumber: { type: String },
    studentName: { type: String },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", "card", "wallet"],
      default: "upi",
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "picked_up", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["normal", "rush"],
      default: "normal",
    },
    items: {
      type: [LineItemSchema],
      default: [],
    },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);

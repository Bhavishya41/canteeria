const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      required: true,
      enum: ["snacks", "meals", "drinks", "desserts", "others"],
      default: "others"
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    image: {
      type: String, // URL/path
      default: null
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Auto-disable when stock hits zero
foodSchema.pre("save", function (next) {
  if (this.stock <= 0) {
    this.isAvailable = false;
  }
  next();
});

module.exports = mongoose.model("Food", foodSchema);

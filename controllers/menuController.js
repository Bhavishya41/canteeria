const Food = require("../models/food");

// Admin: Get all menu items (including unavailable)
exports.getAllMenuItems = async (req, res, next) => {
  try {
    const menu = await Food.find().sort({ category: 1, name: 1 });
    res.json({ data: menu });
  } catch (error) {
    next(error);
  }
};
exports.getMenu = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isAvailable: true } : { isAvailable: true };
    const menu = await Food.find(query).sort({ category: 1, name: 1 });
    res.json({ data: menu });
  } catch (error) {
    next(error);
  }
};

// Public: Get single menu item
exports.getMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Food.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }
    res.json({ data: item });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all menu items (including unavailable)
exports.getAllMenuItems = async (req, res, next) => {
  try {
    const menu = await Food.find().sort({ category: 1, name: 1 });
    res.json({ data: menu });
  } catch (error) {
    next(error);
  }
};

// Admin: Create new menu item
exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, price, category, stock, image, isAvailable } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price, and category are required.",
      });
    }

    const item = await Food.create({
      name,
      price,
      category,
      stock: stock ?? 0,
      image: image || null,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    emitMenuUpdate(req);
    res.status(201).json({ data: item });
  } catch (error) {
    next(error);
  }
};

// Admin: Update menu item
exports.updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Food.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    emitMenuUpdate(req);
    res.json({ data: item });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete menu item
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Food.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    emitMenuUpdate(req);
    res.json({ message: "Menu item deleted successfully.", data: item });
  } catch (error) {
    next(error);
  }
};

// Helper function to emit menu update event
const emitMenuUpdate = (req) => {
  const io = req.app.get("io");
  if (io) {
    io.emit("menu:update", { message: "Menu has been updated" });
  }
};

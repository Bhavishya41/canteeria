const Order = require("../models/order");
const Food = require("../models/food");

const STATUS_PIPELINE = ["pending", "preparing", "ready", "picked_up"];

const emitEvent = (req, event, payload) => {
  const io = req.app.get("io");
  if (io) {
    console.log(`[Socket] Emitting ${event} event`);
    io.emit(event, payload);
  } else {
    console.warn(`[Socket] Socket.io not available, cannot emit ${event}`);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status, studentName } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (studentName) {
      query.studentName = studentName;
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.items || payload.items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must include at least one item." });
    }

    let tokenNumber = payload.tokenNumber;
    if (!tokenNumber) {
      const lastOrder = await Order.findOne()
        .sort({ tokenNumber: -1 })
        .select("tokenNumber");
      tokenNumber = (lastOrder?.tokenNumber || 0) + 1;
    }

    const order = await Order.create({
      tokenNumber,
      ...payload,
    });

    emitEvent(req, "order:new", order);
    res.status(201).json({ data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }
    if (
      ![
        "pending",
        "preparing",
        "ready",
        "picked_up",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Unknown status value." });
    }

    // Get the current order to check previous status
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    const previousStatus = currentOrder.status;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Decrease stock when order is completed (picked_up)
    // Only decrease if the order wasn't already picked_up before
    if (status === "picked_up" && previousStatus !== "picked_up") {
      console.log(`[Order Update] Order ${order._id} marked as picked_up. Revenue: ₹${order.totalAmount}`);
      try {
        // Decrease stock for each item in the order
        for (const item of order.items) {
          const foodItem = await Food.findOne({ name: item.name });
          if (foodItem) {
            // Decrease stock by the quantity ordered
            const newStock = Math.max(0, foodItem.stock - item.quantity);
            // Update stock and isAvailable (set to false if stock is 0 or less)
            foodItem.stock = newStock;
            foodItem.isAvailable = newStock > 0;
            await foodItem.save();
          }
        }
      } catch (stockError) {
        // Log the error but don't fail the order status update
        console.error("Error updating stock:", stockError);
      }
    }

    console.log(`[Order Update] Emitting order:update event for order ${order._id} with status ${order.status}`);
    emitEvent(req, "order:update", order);
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
};

exports.seedOrders = async (req, res, next) => {
  try {
    const sampleMenu = [
      { name: "Masala Dosa", quantity: 1 },
      { name: "Cold Coffee", quantity: 2 },
      { name: "Paneer Roll", quantity: 1 },
      { name: "Veg Thali", quantity: 1 },
      { name: "Idli Sambar", quantity: 3 },
    ];

    const count = Number(req.body?.count) || 4;
    const docs = [];

    for (let i = 0; i < count; i += 1) {
      const items = sampleMenu
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.ceil(Math.random() * 3));
      const totalAmount = items.reduce(
        (acc, curr) => acc + 50 * curr.quantity,
        0
      );

      docs.push({
        studentName: `Student ${Math.ceil(Math.random() * 200)}`,
        tableNumber: `${Math.ceil(Math.random() * 20)}`,
        paymentMethod: Math.random() > 0.5 ? "upi" : "cash",
        priority: Math.random() > 0.85 ? "rush" : "normal",
        notes: Math.random() > 0.7 ? "Less spicy" : "",
        items,
        totalAmount,
      });
    }

    const created = await Order.insertMany(docs);
    created.forEach((order) => emitEvent(req, "order:new", order));

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
};

exports.nextStatus = (currentStatus) => {
  const idx = STATUS_PIPELINE.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_PIPELINE.length - 1) {
    return null;
  }
  return STATUS_PIPELINE[idx + 1];
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    // First, let's check all picked_up orders to debug
    const allPickedUpOrders = await Order.find({ status: 'picked_up' });
    console.log(`[Dashboard Stats] Total picked_up orders in database: ${allPickedUpOrders.length}`);
    if (allPickedUpOrders.length > 0) {
      console.log(`[Dashboard Stats] Sample order:`, {
        id: allPickedUpOrders[0]._id,
        status: allPickedUpOrders[0].status,
        totalAmount: allPickedUpOrders[0].totalAmount,
        createdAt: allPickedUpOrders[0].createdAt,
        items: allPickedUpOrders[0].items
      });
    }

    // Get today's date range (start of day to end of day) - using local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get only completed orders from today (picked_up status = money received)
    const todayOrders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'picked_up' // Only count completed orders where money is received
    });

    console.log(`[Dashboard Stats] Found ${todayOrders.length} picked_up orders today`);
    console.log(`[Dashboard Stats] Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    console.log(`[Dashboard Stats] Current time: ${now.toISOString()}`);

    // If no orders found for today, let's also check recent orders (last 24 hours) for debugging
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({
      createdAt: { $gte: last24Hours },
      status: 'picked_up'
    });
    console.log(`[Dashboard Stats] Found ${recentOrders.length} picked_up orders in last 24 hours`);

    // Use today's orders, or fall back to recent orders if today is empty (for testing)
    const ordersToUse = todayOrders.length > 0 ? todayOrders : recentOrders;
    console.log(`[Dashboard Stats] Using ${ordersToUse.length} orders for stats calculation`);

    // Calculate revenue from completed orders
    const todayRevenue = ordersToUse.reduce((sum, order) => {
      const amount = order.totalAmount || 0;
      console.log(`[Dashboard Stats] Order ${order._id}: ₹${amount}`);
      return sum + amount;
    }, 0);
    
    console.log(`[Dashboard Stats] Revenue: ₹${todayRevenue}`);

    // Get top 5 food items by quantity sold (only from completed orders)
    const itemCounts = {};
    ordersToUse.forEach(order => {
      if (!order.items || order.items.length === 0) {
        console.log(`[Dashboard Stats] Warning: Order ${order._id} has no items`);
        return;
      }
      order.items.forEach(item => {
        if (!item.name) {
          console.log(`[Dashboard Stats] Warning: Order ${order._id} has item without name:`, item);
          return;
        }
        if (itemCounts[item.name]) {
          itemCounts[item.name] += item.quantity || 1;
        } else {
          itemCounts[item.name] = item.quantity || 1;
        }
      });
    });

    console.log(`[Dashboard Stats] Item counts:`, itemCounts);

    const topItems = Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log(`[Dashboard Stats] Top items:`, topItems);

    // Get favorite category - get all unique food items first
    const uniqueItemNames = [...new Set(ordersToUse.flatMap(order => 
      (order.items || []).map(item => item.name).filter(name => name)
    ))];
    
    console.log(`[Dashboard Stats] Unique item names:`, uniqueItemNames);
    
    const foodItems = uniqueItemNames.length > 0 
      ? await Food.find({ name: { $in: uniqueItemNames } })
      : [];
    
    console.log(`[Dashboard Stats] Found ${foodItems.length} food items in database`);
    
    const nameToCategory = {};
    foodItems.forEach(item => {
      nameToCategory[item.name] = item.category;
    });

    // Count items by category (only from completed orders)
    const categoryCounts = {};
    ordersToUse.forEach(order => {
      (order.items || []).forEach(item => {
        const category = nameToCategory[item.name];
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + (item.quantity || 1);
        }
      });
    });

    console.log(`[Dashboard Stats] Category counts:`, categoryCounts);

    const favoriteCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    res.json({
      data: {
        topItems,
        favoriteCategory,
        todayRevenue: Math.round(todayRevenue * 100) / 100, // Round to 2 decimal places
      }
    });
  } catch (error) {
    next(error);
  }
};
// Live Analytics dashboard (client-side)
// Renders a simple analytics dashboard similar to AdminAnalytics React component
// - Fetches orders from /api/orders
// - Listens to socket events: order:new, order:update
// - Computes today's revenue, total orders, and top items

const socket = window.io ? window.io() : null;

const elements = {
  totalRevenue: document.getElementById("total-revenue"),
  totalOrders: document.getElementById("total-orders"),
  topItemName: document.getElementById("top-item-name"),
  topItemCount: document.getElementById("top-item-count"),
  topItemsTbody: document.getElementById("top-items-tbody"),
  refreshBtn: document.getElementById("refresh-analytics"),
  exportBtn: document.getElementById("export-analytics"),
  clearBtn: document.getElementById("clear-analytics"),
};

const state = {
  orders: [],
};

const safeQty = (item) => item.qty ?? item.quantity ?? 1;

const computeStats = (orders) => {
  const todayOrders = orders || [];
  
  // Calculate total revenue from totalAmount field
  const totalRevenue = todayOrders.reduce((sum, o) => {
    return sum + (o.totalAmount ?? 0);
  }, 0);

  const totalOrders = todayOrders.length;

  const itemCounts = {};
  todayOrders.forEach((o) => {
    (o.items || []).forEach((i) => {
      const name = i.name || "Unknown";
      itemCounts[name] = (itemCounts[name] || 0) + safeQty(i);
    });
  });

  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return { totalRevenue, totalOrders, topItems };
};

const formatCurrency = (value) => `₹${Math.round(value)}`;

const render = () => {
  const stats = computeStats(state.orders);
  const top0 = stats.topItems[0] || ["N/A", 0];

  // Update card values
  if (elements.totalRevenue) {
    elements.totalRevenue.textContent = formatCurrency(stats.totalRevenue);
  }
  
  if (elements.totalOrders) {
    elements.totalOrders.textContent = stats.totalOrders;
  }
  
  if (elements.topItemName) {
    elements.topItemName.textContent = top0[0];
  }
  
  if (elements.topItemCount) {
    elements.topItemCount.textContent = top0[1] ? `${top0[1]} units sold` : '';
  }

  // Update top items table
  if (elements.topItemsTbody) {
    if (stats.topItems.length === 0) {
      elements.topItemsTbody.innerHTML = '<tr><td colspan="3" class="empty-state">No data available</td></tr>';
    } else {
      const topRows = stats.topItems
        .map(([name, count], idx) => {
          const width = Math.round((count / (top0[1] || 1)) * 100);
          return `
            <tr>
              <td class="item-name">
                <span class="item-rank">#${idx + 1}</span>
                ${name}
              </td>
              <td class="item-count">${count}</td>
              <td>
                <div class="trend-bar-container">
                  <div class="trend-bar" style="width:${width}%;"></div>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
      elements.topItemsTbody.innerHTML = topRows;
    }
  }
};

const upsertOrder = (order) => {
  const idx = state.orders.findIndex((o) => o._id === order._id);
  if (idx > -1) state.orders[idx] = order;
  else state.orders.push(order);
  state.orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  render();
};

const fetchOrders = async () => {
  if (elements.refreshBtn) elements.refreshBtn.disabled = true;
  try {
    const res = await fetch('/api/orders');
    const body = await res.json();
    state.orders = body.data || [];
    console.log('Orders fetched:', state.orders.length, 'orders');
    render();
  } catch (err) {
    console.error('Failed to fetch orders', err);
  } finally {
    if (elements.refreshBtn) elements.refreshBtn.disabled = false;
  }
};

if (socket) {
  socket.on('connect', () => {
    console.info('Analytics socket connected', socket.id);
  });
  
  socket.on('order:new', (order) => {
    console.log('New order received:', order._id);
    upsertOrder(order);
  });
  
  socket.on('order:update', (order) => {
    console.log('Order updated:', order._id);
    upsertOrder(order);
  });
  
  socket.on('disconnect', () => {
    console.warn('Analytics socket disconnected');
  });
} else {
  console.warn('Socket.IO not available');
}

// Export to CSV functionality
const exportToCSV = () => {
  const stats = computeStats(state.orders);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  // Create CSV content
  let csvContent = "Campus Analytics Export\n";
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  // Summary section
  csvContent += "SUMMARY\n";
  csvContent += `Total Revenue,₹${Math.round(stats.totalRevenue)}\n`;
  csvContent += `Total Orders,${stats.totalOrders}\n`;
  csvContent += `Top Selling Item,${stats.topItems[0] ? stats.topItems[0][0] : 'N/A'}\n\n`;
  
  // Top items section
  csvContent += "TOP PERFORMING ITEMS\n";
  csvContent += "Rank,Item Name,Units Sold,Percentage\n";
  stats.topItems.forEach(([name, count], idx) => {
    const percentage = stats.topItems[0] ? Math.round((count / stats.topItems[0][1]) * 100) : 0;
    csvContent += `${idx + 1},"${name}",${count},${percentage}%\n`;
  });
  
  // Detailed orders section
  csvContent += "\nDETAILED ORDERS\n";
  csvContent += "Order ID,Token,Student Name,Table,Payment Method,Status,Total Amount,Items,Created At\n";
  state.orders.forEach(order => {
    const items = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join('; ');
    const createdAt = new Date(order.createdAt).toLocaleString();
    csvContent += `${order._id},${order.tokenNumber || '—'},"${order.studentName || 'Anonymous'}",${order.tableNumber || 'Takeaway'},${order.paymentMethod || 'UPI'},${order.status},₹${order.totalAmount || 0},"${items}",${createdAt}\n`;
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('Analytics exported to CSV');
};

// Clear today's analytics data
const clearAnalytics = () => {
  if (!confirm("⚠️ Clear today's analytics data from display? This will reset all metrics until new orders arrive.")) return;
  
  state.orders = [];
  render();
  console.log("Analytics data cleared from display");
};

// Wire up buttons
if (elements.refreshBtn) {
  elements.refreshBtn.addEventListener('click', fetchOrders);
}

if (elements.exportBtn) {
  elements.exportBtn.addEventListener('click', exportToCSV);
}

if (elements.clearBtn) {
  elements.clearBtn.addEventListener('click', clearAnalytics);
}

// initial load
fetchOrders();

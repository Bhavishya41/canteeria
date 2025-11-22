const STATUS_PIPELINE = ["pending", "preparing", "ready", "picked_up"];
const board = document.getElementById("orders-board");
const emptyState = document.getElementById("orders-empty");
const filterButtons = document.querySelectorAll("[data-filter]");
const refreshBtn = document.getElementById("refresh-orders");
const seedBtn = document.getElementById("seed-orders");
const countNodes = {
  pending: document.getElementById("pending-count"),
  preparing: document.getElementById("preparing-count"),
  ready: document.getElementById("ready-count"),
};

const state = {
  orders: [],
  filter: "all",
};

const socket = window.io();

const getNextStatus = (status) => {
  const idx = STATUS_PIPELINE.indexOf(status);
  if (idx === -1 || idx === STATUS_PIPELINE.length - 1) {
    return null;
  }
  return STATUS_PIPELINE[idx + 1];
};

const getOrderColor = (status) => `order-status ${status}`;

const updateCounts = () => {
  const counts = state.orders.reduce(
    (acc, order) => {
      if (acc[order.status] !== undefined) {
        acc[order.status] += 1;
      }
      return acc;
    },
    { pending: 0, preparing: 0, ready: 0 }
  );
  Object.entries(countNodes).forEach(([key, node]) => {
    if (node) node.textContent = counts[key] ?? 0;
  });
};

const render = () => {
  const filtered =
    state.filter === "all"
      ? state.orders
      : state.orders.filter((order) => order.status === state.filter);

  board.innerHTML = "";
  filtered.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-card";
    card.dataset.id = order._id;

    const rushPill =
      order.priority === "rush"
        ? '<span class="rush-pill">rush</span>'
        : "";

    const itemsHtml = order.items
      .map(
        (item) =>
          `<li>${item.quantity || 1} x ${item.name}${
            item.notes ? ` <em>(${item.notes})</em>` : ""
          }</li>`
      )
      .join("");

    const nextStatus = getNextStatus(order.status);

    card.innerHTML = `
      <div class="order-meta">
        <span>Token #${order.tokenNumber ?? "—"}</span>
        <span>${new Date(order.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
      </div>
      <h3>${order.studentName || "Anonymous"} ${rushPill}</h3>
      <div class="order-meta">
        <span>Table ${order.tableNumber || "Takeaway"}</span>
        <span>${order.paymentMethod?.toUpperCase() || "UPI"}</span>
      </div>
      <ul class="order-items">${itemsHtml}</ul>
      ${
        order.notes
          ? `<p class="order-notes">Note: ${order.notes}</p>`
          : ""
      }
      <span class="${getOrderColor(order.status)}">${order.status.replace(
      "_",
      " "
    )}</span>
      <div class="order-actions">
        <button data-action="advance" ${
          nextStatus ? "" : "disabled"
        }>${nextStatus ? `Mark ${nextStatus}` : "Complete"}</button>
        <button class="secondary" data-action="ready">${
          order.status === "ready" ? "Notify" : "Jump to Ready"
        }</button>
      </div>
    `;

    board.appendChild(card);
  });

  emptyState.classList.toggle("hidden", filtered.length > 0);
  updateCounts();
};

const upsertOrder = (order) => {
  const idx = state.orders.findIndex((item) => item._id === order._id);
  if (idx > -1) {
    state.orders[idx] = order;
  } else {
    state.orders.push(order);
  }
  state.orders.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  render();
};

const fetchOrders = async () => {
  refreshBtn.disabled = true;
  try {
    const res = await fetch("/api/orders");
    const body = await res.json();
    state.orders = body.data || [];
    render();
  } catch (error) {
    console.error("Failed to fetch orders", error);
  } finally {
    refreshBtn.disabled = false;
  }
};

const patchOrderStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || "Failed to update order");
    }
    upsertOrder(body.data);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const seedOrders = async () => {
  seedBtn.disabled = true;
  try {
    await fetch("/api/orders/seed", { method: "POST" });
  } catch (error) {
    console.error("Failed to seed orders", error);
  } finally {
    seedBtn.disabled = false;
  }
};

board.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = button.closest(".order-card");
  if (!card) return;
  const orderId = card.dataset.id;
  const order = state.orders.find((item) => item._id === orderId);
  if (!order) return;

  const { action } = button.dataset;
  if (action === "advance") {
    const next = getNextStatus(order.status);
    if (next) patchOrderStatus(orderId, next);
  } else if (action === "ready") {
    patchOrderStatus(orderId, "ready");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    render();
  });
});

refreshBtn.addEventListener("click", fetchOrders);
seedBtn.addEventListener("click", seedOrders);

socket.on("connect", () => {
  console.info("KDS connected", socket.id);
});

socket.on("order:new", (order) => upsertOrder(order));
socket.on("order:update", (order) => upsertOrder(order));

fetchOrders();


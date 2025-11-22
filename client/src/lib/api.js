// API utility functions for backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Menu API (Public)
export const getMenu = async () => {
  const data = await apiCall('/api/menu');
  return data.data || [];
};

// Admin Menu API (CRUD)
export const getAllMenuItems = async () => {
  const data = await apiCall('/api/menu/admin/all');
  return data.data || [];
};

export const createMenuItem = async (itemData) => {
  const data = await apiCall('/api/menu/admin', {
    method: 'POST',
    body: itemData,
  });
  return data.data;
};

export const updateMenuItem = async (id, itemData) => {
  const data = await apiCall(`/api/menu/admin/${id}`, {
    method: 'PATCH',
    body: itemData,
  });
  return data.data;
};

export const deleteMenuItem = async (id) => {
  const data = await apiCall(`/api/menu/admin/${id}`, {
    method: 'DELETE',
  });
  return data;
};

// Orders API
export const createOrder = async (orderData) => {
  const data = await apiCall('/api/orders', {
    method: 'POST',
    body: orderData,
  });
  return data.data;
};

export const getMyOrders = async (studentName) => {
  const query = studentName ? `?studentName=${encodeURIComponent(studentName)}` : '';
  const data = await apiCall(`/api/orders${query}`);
  return data.data || [];
};

export const getOrderById = async (orderId) => {
  const data = await apiCall(`/api/orders/${orderId}`);
  return data.data;
};

// Admin Dashboard API
export const getDashboardStats = async () => {
  const data = await apiCall('/api/orders/dashboard/stats');
  return data.data || {};
};

export default {
  getMenu,
  createOrder,
  getMyOrders,
  getOrderById,
  getDashboardStats,
};


// src/AdminMenuPage.jsx - Admin Dashboard for Menu CRUD Operations

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getDashboardStats } from './lib/api';
import socket from './lib/socket';

const CATEGORIES = ['snacks', 'meals', 'drinks', 'desserts', 'others'];

const AdminMenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    topItems: [],
    favoriteCategory: 'N/A',
    todayRevenue: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'snacks',
    stock: 0,
    image: '',
    isAvailable: true,
  });

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await getAllMenuItems();
      setMenu(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      const stats = await getDashboardStats();
      console.log('Dashboard stats received:', stats);
      
      // Validate the stats object
      if (!stats) {
        console.error('No stats received from API');
        return;
      }
      
      // Ensure all required fields exist
      const validatedStats = {
        topItems: stats.topItems || [],
        favoriteCategory: stats.favoriteCategory || 'N/A',
        todayRevenue: stats.todayRevenue || 0,
      };
      
      console.log('Validated stats:', validatedStats);
      setDashboardStats(validatedStats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      console.error('Error details:', err.message, err.stack);
      // Set default values on error
      setDashboardStats({
        topItems: [],
        favoriteCategory: 'N/A',
        todayRevenue: 0,
      });
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchDashboardStats();
    
    // Listen for menu updates from other admins
    const handleMenuUpdate = () => {
      console.log('Menu update received');
      fetchMenu();
      fetchDashboardStats();
    };
    
    // Listen for order updates to refresh dashboard
    const handleOrderUpdate = (order) => {
      console.log('Order update received:', order);
      // Always refresh dashboard on order updates to ensure real-time accuracy
      // Especially important when order is marked as picked_up (money received)
      if (order && order.status === 'picked_up') {
        console.log('Order marked as picked_up, refreshing dashboard...');
      }
      fetchDashboardStats();
    };
    
    const handleOrderNew = (order) => {
      console.log('New order received:', order);
      // Refresh on new orders
      fetchDashboardStats();
    };
    
    socket.on('menu:update', handleMenuUpdate);
    socket.on('order:new', handleOrderNew);
    socket.on('order:update', handleOrderUpdate);
    
    // Set up periodic refresh as backup (every 5 seconds)
    const intervalId = setInterval(() => {
      fetchDashboardStats();
    }, 5000);
    
    return () => {
      socket.off('menu:update', handleMenuUpdate);
      socket.off('order:new', handleOrderNew);
      socket.off('order:update', handleOrderUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        stock: item.stock.toString(),
        image: item.image || '',
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: 'snacks',
        stock: '0',
        image: '',
        isAvailable: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category: 'snacks',
      stock: '0',
      image: '',
      isAvailable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        image: formData.image.trim() || null,
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        await updateMenuItem(editingItem._id, payload);
      } else {
        await createMenuItem(payload);
      }

      await fetchMenu();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save item:', err);
      alert(`Failed to save: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteMenuItem(id);
      await fetchMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateMenuItem(item._id, {
        isAvailable: !item.isAvailable,
      });
      await fetchMenu();
    } catch (err) {
      console.error('Failed to update availability:', err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <p className="text-2xl font-black text-foreground">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="md:hidden sticky top-0 bg-secondary border-b-4 border-foreground p-4 z-20 shadow-lg">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wider text-center">
          Admin Menu Dashboard
        </h1>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-20">
        {/* Dashboard Stats Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-foreground">Dashboard Stats</h2>
          <button
            onClick={fetchDashboardStats}
            className="bg-primary text-foreground px-4 py-2 border-2 border-foreground font-bold hover:bg-yellow-400"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Revenue */}
          <div className="section-neobrutal bg-primary">
            <h3 className="text-lg font-bold text-foreground mb-2">Today's Revenue</h3>
            <p className="text-3xl font-black text-foreground">₹{dashboardStats.todayRevenue.toFixed(2)}</p>
          </div>

          {/* Favorite Category */}
          <div className="section-neobrutal bg-secondary">
            <h3 className="text-lg font-bold text-foreground mb-2">Favorite Category</h3>
            <p className="text-3xl font-black text-foreground capitalize">{dashboardStats.favoriteCategory}</p>
          </div>

          {/* Top Items Count */}
          <div className="section-neobrutal bg-secondary">
            <h3 className="text-lg font-bold text-foreground mb-2">Top Items Tracked</h3>
            <p className="text-3xl font-black text-foreground">{dashboardStats.topItems.length}</p>
          </div>
        </div>

        {/* Top 5 Food Items */}
        {dashboardStats.topItems.length > 0 && (
          <div className="section-neobrutal bg-secondary mb-8">
            <h3 className="section-title">🔥 Top 5 Food Items (Today)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dashboardStats.topItems.map((item, index) => (
                <div key={index} className="bg-white p-4 border-2 border-foreground">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-foreground">#{index + 1}</span>
                    <span className="text-lg font-bold text-green-600">{item.quantity}x</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-black text-foreground border-b-4 border-foreground pb-2">
            Menu Management
          </h2>
          <button
            onClick={() => handleOpenModal()}
            className="action-button-neobrutal flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-4 border-red-600 p-4 mb-6 text-red-800 font-bold">
            {error}
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              onEdit={() => handleOpenModal(item)}
              onDelete={() => handleDelete(item._id, item.name)}
              onToggleAvailability={() => toggleAvailability(item)}
            />
          ))}
        </div>

        {menu.length === 0 && (
          <div className="section-neobrutal bg-secondary text-center p-8">
            <p className="text-gray-600 mb-4">No menu items yet.</p>
            <button
              onClick={() => handleOpenModal()}
              className="action-button-neobrutal"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </main>

      {/* Modal for Add/Edit */}
      {showModal && (
        <Modal
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      )}

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t-4 border-foreground shadow-inner flex justify-around items-center z-10 md:hidden">
        <Link to="/" className="mobile-nav-item">🏠 Home</Link>
        <Link to="/menu" className="mobile-nav-item">🍲 Menu</Link>
        <Link to="/admin/menu" className="mobile-nav-item border-b-4 border-primary text-foreground">
          ⚙️ Admin
        </Link>
        <Link to="/login" className="mobile-nav-item">👤 Login</Link>
      </nav>
    </div>
  );
};

// Menu Item Card Component
const MenuItemCard = ({ item, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <div
      className={`bg-secondary p-4 border-4 border-foreground shadow-lg ${
        !item.isAvailable ? 'opacity-60 grayscale' : ''
      }`}
    >
      {item.image && (
        <div
          className="w-full h-32 bg-gray-200 mb-3 border-2 border-foreground bg-cover bg-center"
          style={{ backgroundImage: `url(${item.image})` }}
        />
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-extrabold text-lg text-foreground uppercase flex-1">
          {item.name}
        </h3>
        <span className="bg-black text-white px-2 py-1 font-bold text-sm">
          ₹{item.price.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="font-bold">Category:</span>
          <span className="capitalize">{item.category}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold">Stock:</span>
          <span className={item.stock > 0 ? 'text-green-600' : 'text-red-600'}>
            {item.stock}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold">Status:</span>
          <span
            className={`font-bold ${
              item.isAvailable ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-500 text-white p-2 border-2 border-foreground font-bold hover:bg-blue-600 flex items-center justify-center gap-1"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={onToggleAvailability}
          className={`flex-1 p-2 border-2 border-foreground font-bold ${
            item.isAvailable
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {item.isAvailable ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-2 border-2 border-foreground font-bold hover:bg-red-600 flex items-center justify-center"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ editingItem, formData, setFormData, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-foreground shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-foreground">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-foreground"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border-2 border-foreground bg-white text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2 border-2 border-foreground bg-white text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border-2 border-foreground bg-white text-foreground"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2 border-2 border-foreground bg-white text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2 border-2 border-foreground bg-white text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="isAvailable" className="text-sm font-bold">
                Available for ordering
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-foreground p-3 border-2 border-foreground font-bold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 action-button-neobrutal flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuPage;


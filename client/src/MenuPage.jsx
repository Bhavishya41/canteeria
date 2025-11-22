// src/MenuPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { getMenu } from './lib/api';

// Helper function to render a food card
const FoodCard = ({ item, onAddToCart, isInCart, cartQuantity }) => {
  const isAvailable = item.isAvailable && item.stock > 0;
  
  return (
    <div className={`bg-secondary p-4 border-4 border-foreground shadow-lg shadow-primary/50 transition transform hover:scale-[1.02] hover:shadow-xl ${!isAvailable ? 'opacity-60 grayscale' : ''} ${isInCart ? 'ring-4 ring-green-500 ring-offset-2' : ''}`}>
      {item.image && (
        <div 
          className="w-full h-32 bg-gray-200 mb-3 border-2 border-foreground bg-cover bg-center" 
          style={{ backgroundImage: `url(${item.image})` }}
        />
      )}
      <h4 className="font-extrabold text-lg text-foreground uppercase">{item.name}</h4>
      <p className="text-gray-600 text-sm mb-3">
        {item.category} {!isAvailable && '(Out of Stock)'}
        {isInCart && <span className="text-green-600 font-bold ml-2">✓ In Cart ({cartQuantity})</span>}
      </p>
      <div className="flex justify-between items-center border-t-2 border-gray-200 pt-2">
        <span className="text-xl font-black text-foreground">₹{item.price.toFixed(2)}</span>
        <button 
          onClick={() => onAddToCart(item)}
          disabled={!isAvailable}
          className={`py-1 px-3 font-bold text-sm border-2 border-foreground shadow-md shadow-primary/50 transition ${
            isAvailable 
              ? isInCart
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-primary text-foreground hover:bg-yellow-400 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAvailable ? (isInCart ? '✓ Added' : '+ Add') : 'Sold Out'}
        </button>
      </div>
    </div>
  );
};

// Main Menu Component
const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const menuData = await getMenu();
        setMenu(menuData);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAddToCart = (item) => {
    addToCart({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category,
    });
    
    // Show notification
    setNotification({
      message: `${item.name} added to cart!`,
      type: 'success'
    });
  };

  const isItemInCart = (itemId) => {
    return cart.some(item => item.id === itemId);
  };

  const getCartQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Group items by category
  const groupedItems = menu.reduce((acc, item) => {
    const categoryKey = item.category || 'others';
    acc[categoryKey] = acc[categoryKey] || [];
    acc[categoryKey].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    snacks: '🍔 Snacks',
    meals: '🍜 Meals',
    drinks: '🥤 Drinks',
    desserts: '🍰 Desserts',
    others: '🍽️ Others',
  };

  const renderSection = (category) => {
    const items = groupedItems[category] || [];
    if (items.length === 0) return null;

    return (
      <section key={category} className="section-neobrutal bg-secondary mb-8">
        <h3 className="section-title">{categoryLabels[category] || category}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <FoodCard 
              key={item._id} 
              item={item} 
              onAddToCart={handleAddToCart}
              isInCart={isItemInCart(item._id)}
              cartQuantity={getCartQuantity(item._id)}
            />
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <p className="text-2xl font-black text-foreground">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <p className="text-xl font-bold text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="action-button-neobrutal"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header for Mobile View */}
      <header className="md:hidden sticky top-0 bg-secondary border-b-4 border-foreground p-4 z-20 shadow-lg">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wider text-center">
          CampusFeed Menu
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pb-20">
        <h2 className="text-4xl font-black text-foreground mb-8 border-b-4 border-foreground pb-2">
          What's Cooking?
        </h2>
        
        {/* Render Sections by Category */}
        {Object.keys(groupedItems).map(renderSection)}

        {menu.length === 0 && (
          <div className="section-neobrutal bg-secondary text-center p-8">
            <p className="text-gray-600">No items available at the moment.</p>
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t-4 border-foreground shadow-inner flex justify-around items-center z-10 md:hidden">
        <Link to="/" className="mobile-nav-item">🏠 Home</Link>
        <Link to="/menu" className="mobile-nav-item border-b-4 border-primary text-foreground">🍲 Menu</Link>
        <Link to="/login" className="mobile-nav-item">👤 Log In</Link>
        <button 
          onClick={() => navigate('/cart')}
          className="mobile-nav-item text-green-700 font-bold"
        >
          🛒 Cart ({cart.length})
        </button>
      </nav>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 notification-toast md:bottom-24">
          <div className="bg-green-500 text-white px-6 py-3 border-4 border-foreground shadow-xl font-bold text-lg">
            ✓ {notification.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
// src/CartPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { createOrder } from './lib/api';
import socket from './lib/socket';

const TAX_RATE = 0.08;

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotal, studentName, setStudentName } = useCart();
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [notes, setNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const navigate = useNavigate();

  // Listen for order status updates
  useEffect(() => {
    const handleOrderUpdate = (order) => {
      if (placedOrder && order._id === placedOrder._id) {
        setPlacedOrder(order);
        if (order.status === 'ready') {
          // Show notification when order is ready
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Ready!', {
              body: `Your order #${order.tokenNumber} is ready for pickup!`,
              icon: '/pwa-192x192.png',
            });
          }
        }
      }
    };

    socket.on('order:update', handleOrderUpdate);

    return () => {
      socket.off('order:update', handleOrderUpdate);
    };
  }, [placedOrder]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const subtotal = getTotal();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!studentName.trim()) {
      const name = prompt('Please enter your name:');
      if (!name || !name.trim()) {
        alert('Name is required to place an order.');
        return;
      }
      setStudentName(name.trim());
    }

    setIsPlacingOrder(true);

    try {
      const orderData = {
        studentName: studentName.trim(),
        tableNumber: tableNumber.trim() || 'Takeaway',
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
        })),
        totalAmount: Math.round(total * 100) / 100, // Round to 2 decimal places
        notes: notes.trim() || undefined,
        priority: 'normal',
      };

      const order = await createOrder(orderData);
      setPlacedOrder(order);
      setOrderPlaced(true);
      clearCart();
      
      // Show success message
      alert(`Order placed successfully! Token: #${order.tokenNumber}`);
      
      // Navigate to orders page or show order details
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderPlaced && placedOrder) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <div className="section-neobrutal bg-secondary p-8 text-center max-w-md">
          <h2 className="text-3xl font-black text-green-600 mb-4">✅ Order Placed!</h2>
          <p className="text-xl font-bold mb-2">Token: #{placedOrder.tokenNumber}</p>
          <p className="text-gray-600 mb-4">Your order is being prepared.</p>
          <p className="text-sm text-gray-500 mb-6">
            Status: <span className="font-bold capitalize">{placedOrder.status}</span>
          </p>
          <Link to="/orders" className="action-button-neobrutal">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header for Mobile View */}
      <header className="md:hidden sticky top-0 bg-secondary border-b-4 border-foreground p-4 z-20 shadow-lg">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wider text-center">
          Your Cart
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Cart Items List */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="section-title">Items in Your Cart ({cart.length})</h2>
          
          {cart.map(item => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}

          {cart.length === 0 && (
            <div className="section-neobrutal bg-secondary text-center text-gray-500 p-8">
              Your cart is empty! <Link to="/menu" className="text-accent font-bold">Start ordering.</Link>
            </div>
          )}
          
          {cart.length > 0 && (
            <Link to="/menu" className="nav-button-secondary inline-block mt-4 w-auto">
              ⬅️ Continue Shopping
            </Link>
          )}
        </section>

        {/* 2. Order Summary & Checkout */}
        <section className="section-neobrutal bg-secondary h-fit space-y-4">
          <h2 className="section-title">Order Summary</h2>
          
          {/* Student Name Input */}
          <div>
            <label className="block text-sm font-bold mb-1">Your Name *</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-2 border-2 border-foreground bg-white text-foreground"
              required
            />
          </div>

          {/* Table Number Input */}
          <div>
            <label className="block text-sm font-bold mb-1">Table Number</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Leave empty for takeaway"
              className="w-full p-2 border-2 border-foreground bg-white text-foreground"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-bold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border-2 border-foreground bg-white text-foreground"
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold mb-1">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Less spicy, No onions..."
              className="w-full p-2 border-2 border-foreground bg-white text-foreground"
              rows="2"
            />
          </div>
          
          <div className="space-y-3 text-lg mb-6 border-t-4 border-foreground pt-4">
            <SummaryRow label="Subtotal" value={subtotal} />
            <SummaryRow label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={tax} />
            <div className="border-t-2 border-foreground pt-2">
              <SummaryRow label="Grand Total" value={total} isTotal={true} />
            </div>
          </div>

          {/* Place Order Button */}
          <button 
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isPlacingOrder || !studentName.trim()}
            className="action-button-neobrutal w-full text-center text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </section>
      </main>
      
      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t-4 border-foreground shadow-inner flex justify-around items-center z-10 md:hidden">
        <Link to="/" className="mobile-nav-item">🏠 Home</Link>
        <Link to="/menu" className="mobile-nav-item">🍲 Menu</Link>
        <Link to="/cart" className="mobile-nav-item border-b-4 border-primary text-foreground">🛒 Cart</Link>
        <Link to="/login" className="mobile-nav-item">👤 Login</Link>
      </nav>
    </div>
  );
};

// --- Helper Components ---

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <div className="bg-secondary p-4 flex items-center border-4 border-foreground shadow-xl">
    {/* Item Info */}
    <div className="flex-1">
      <h4 className="font-extrabold text-xl text-foreground">{item.name}</h4>
      <span className="text-gray-600">₹{item.price.toFixed(2)} each</span>
    </div>

    {/* Quantity Controls */}
    <div className="flex items-center space-x-2 border-2 border-foreground p-1 bg-white mx-4">
      <button 
        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        className="text-accent text-2xl px-2 font-bold hover:bg-primary/20"
      >
        -
      </button>
      <span className="text-xl font-bold text-foreground w-6 text-center">{item.quantity}</span>
      <button 
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        className="text-accent text-2xl px-2 font-bold hover:bg-primary/20"
      >
        +
      </button>
    </div>

    {/* Total Price */}
    <span className="text-2xl font-black text-foreground w-24 text-right">
      ₹{(item.price * item.quantity).toFixed(2)}
    </span>
  </div>
);

const SummaryRow = ({ label, value, isTotal = false }) => (
  <div className={`flex justify-between ${isTotal ? 'text-2xl font-black text-foreground' : 'text-gray-700'}`}>
    <span>{label}</span>
    <span>₹{value.toFixed(2)}</span>
  </div>
);

export default CartPage;

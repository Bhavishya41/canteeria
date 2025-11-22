// src/OrdersPage.jsx - Shows user's orders with real-time status updates

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { getMyOrders } from './lib/api';
import socket from './lib/socket';
import { Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';

const OrdersPage = () => {
  const { studentName } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!studentName) {
        setLoading(false);
        return;
      }

      try {
        const orderData = await getMyOrders(studentName);
        // Filter out picked_up orders, or show all - you can adjust this
        setOrders(orderData.filter(order => order.status !== 'picked_up'));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Listen for new orders
    const handleNewOrder = (order) => {
      if (order.studentName === studentName) {
        setOrders(prev => {
          const exists = prev.find(o => o._id === order._id);
          if (exists) return prev;
          return [order, ...prev].filter(o => o.status !== 'picked_up');
        });
      }
    };

    // Listen for order updates
    const handleOrderUpdate = (order) => {
      if (order.studentName === studentName) {
        setOrders(prev => {
          const updated = prev.map(o => o._id === order._id ? order : o);
          return updated.filter(o => o.status !== 'picked_up');
        });

        // Show notification when order is ready
        if (order.status === 'ready') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Ready!', {
              body: `Your order #${order.tokenNumber} is ready for pickup!`,
              icon: '/pwa-192x192.png',
            });
          }
        }
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:update', handleOrderUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:update', handleOrderUpdate);
    };
  }, [studentName]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'preparing':
        return <Package className="text-blue-500" size={24} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={24} />;
      default:
        return <AlertCircle className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-400';
      case 'preparing':
        return 'bg-yellow-400';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  if (!studentName) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <div className="section-neobrutal bg-secondary p-8 text-center max-w-md">
          <h2 className="text-2xl font-black text-foreground mb-4">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">Please place an order first.</p>
          <Link to="/menu" className="action-button-neobrutal">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <p className="text-2xl font-black text-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="md:hidden sticky top-0 bg-secondary border-b-4 border-foreground p-4 z-20 shadow-lg">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wider text-center">
          My Orders
        </h1>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-20">
        <h2 className="text-4xl font-black text-foreground mb-8 border-b-4 border-foreground pb-2">
          Order Queue
        </h2>

        {orders.length === 0 ? (
          <div className="section-neobrutal bg-secondary text-center p-8">
            <p className="text-gray-600 mb-4">No active orders.</p>
            <Link to="/menu" className="text-accent font-bold">Start ordering!</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order._id}
                className="border-4 border-foreground bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
              >
                <div
                  className={`p-3 border-b-4 border-foreground flex justify-between items-center ${getStatusColor(
                    order.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-black text-lg uppercase">
                      Token: #{order.tokenNumber || '—'}
                    </span>
                  </div>
                  <span className="font-bold uppercase px-2 bg-white border-2 border-foreground text-xs">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-4">
                  <div className="mb-2 text-sm text-gray-600">
                    Table: {order.tableNumber || 'Takeaway'} | Payment: {order.paymentMethod?.toUpperCase() || 'UPI'}
                  </div>
                  <ul className="list-disc pl-5 font-medium mb-4">
                    {order.items?.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity || 1} x {item.name}
                        {item.notes && <em className="text-gray-500"> ({item.notes})</em>}
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Note:</strong> {order.notes}
                    </p>
                  )}
                  <div className="text-sm text-gray-500">
                    Placed: {new Date(order.createdAt).toLocaleString()}
                  </div>
                  {order.status === 'ready' && (
                    <div className="bg-blue-600 text-white p-3 font-bold text-center border-2 border-foreground animate-pulse mt-4">
                      🎉 READY FOR PICKUP AT COUNTER 🎉
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t-4 border-foreground shadow-inner flex justify-around items-center z-10 md:hidden">
        <Link to="/" className="mobile-nav-item">🏠 Home</Link>
        <Link to="/menu" className="mobile-nav-item">🍲 Menu</Link>
        <Link to="/cart" className="mobile-nav-item">🛒 Cart</Link>
        <Link to="/orders" className="mobile-nav-item border-b-4 border-primary text-foreground">
          📋 Orders
        </Link>
      </nav>
    </div>
  );
};

export default OrdersPage;


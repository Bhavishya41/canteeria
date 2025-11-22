// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignUpPage from './SignUpPage';
import HomePage from './HomePage';
import MenuPage from './MenuPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import AdminMenuPage from './AdminMenuPage';
import ProfilePage from './ProfilePage';
import ResponsiveLayout from './ResponsiveLayout';

// A component to group pages that share the main layout
const MainLayout = () => {
  return (
    <ResponsiveLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/menu" element={<AdminMenuPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Fallback for routes within the layout */}
        <Route path="*" element={<h1 className="text-center text-3xl mt-20 text-red-700">404 - Page Not Found</h1>} />
      </Routes>
    </ResponsiveLayout>
  );
};

function App() {
  return (
    <Routes>
      {/* Routes that do NOT have the main navigation */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Routes that HAVE the main navigation */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
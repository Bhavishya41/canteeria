// src/ResponsiveLayout.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ResponsiveLayout = ({ children }) => {
  const location = useLocation();
  
  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/menu', label: 'Full Menu', icon: '🍲' },
    { path: '/cart', label: 'My Cart', icon: '🛒' },
    { path: '/orders', label: 'My Orders', icon: '📋' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* 1. Left Sidebar Navigation (Desktop/Tablet) */}
      <nav className="hidden md:flex flex-col w-64 bg-secondary border-r-4 border-foreground shadow-xl shadow-primary/50">
        
        {/* Logo and Site Name */}
        <div className="flex items-center justify-center p-6 border-b-4 border-foreground h-20">
          <span className="text-3xl font-extrabold text-foreground tracking-wider">
            CampusFeed
          </span>
        </div>

        {/* Main Navigation Links */}
        <div className="flex-grow pt-8">
          {navLinks.map(link => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`nav-item ${location.pathname === link.path ? 'border-l-4 border-primary bg-primary/20 text-foreground' : ''}`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons (Bottom of Nav) */}
        <div className="p-4 border-t-4 border-foreground">
          <Link to="/login" className="nav-button-secondary">Log In</Link>
          <Link to="/signup" className="nav-button-primary mt-2">Sign Up</Link>
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* 3. Bottom Mobile Navigation (Small Screens) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary border-t-4 border-foreground shadow-inner md:hidden flex justify-around items-center z-10">
        {navLinks.map(link => (
          <Link 
            key={link.path}
            to={link.path} 
            className={`mobile-nav-item ${location.pathname === link.path ? 'border-b-4 border-primary text-foreground' : ''}`}
          >
            {link.icon} {link.label === 'Full Menu' ? 'Menu' : link.label}
          </Link>
        ))}
        <Link to="/login" className="mobile-nav-item">👤 Login</Link>
      </nav>
      
    </div>
  );
};

export default ResponsiveLayout;
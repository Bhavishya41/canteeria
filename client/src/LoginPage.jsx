// src/LoginPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Add your actual authentication logic (API call) here
    console.log('Logging in with:', { email, password });
    // IMPORTANT: Custom UI modal should replace this alert() in a final PWA
    alert(`Attempting to log in for: ${email}`); 
  };

  return (
    // Outer container: Light background
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      {/* Form Card: Neobrutalist style with thick border and shadow */}
      <form onSubmit={handleLogin} 
            className="w-full max-w-md p-8 bg-secondary rounded-lg 
                       border-4 border-foreground shadow-xl shadow-primary/50"> 
        
        {/* Header: Black text */}
        <h2 className="text-3xl font-bold text-center text-foreground mb-8 border-b-4 border-foreground pb-2">
          Log In
        </h2>
        
        {/* Email Group */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            // Input field border updated for neobrutalism
            className="w-full px-4 py-2 border-2 border-foreground rounded-lg 
                       focus:outline-none focus:ring-4 focus:ring-primary/50 transition duration-150"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Password Group */}
        <div className="mb-8">
          <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            // Input field border updated for neobrutalism
            className="w-full px-4 py-2 border-2 border-foreground rounded-lg 
                       focus:outline-none focus:ring-4 focus:ring-primary/50 transition duration-150"
            placeholder="********"
          />
        </div>

        {/* Submit Button: Solid yellow, using the neobrutal action style */}
        <button 
          type="submit" 
          className="w-full action-button-neobrutal py-3" // Using the custom class defined in index.css
        >
          Log In
        </button>

        {/* Footer Link using <Link to="..."> for navigation */}
        <p className="text-center text-sm mt-6 text-gray-600">
          Don't have an account? 
          <Link to="/signup" className="text-accent hover:text-red-800 font-medium ml-1 transition underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
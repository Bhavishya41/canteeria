// src/HomePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder image paths - ensure these files exist in your 'public/assets' folder
const FOOD_IMAGE_1 = '/assets/food1.jpg'; // Example: Sandwich or Pizza
const FOOD_IMAGE_2 = '/assets/food2.jpg'; // Example: Burger or Fries
const FOOD_IMAGE_3 = '/assets/food3.jpg'; // Example: Dessert or Coffee

const HomePage = () => {
  return (
    // Main Container: Screen height, flex layout for side nav and content
    <div className="flex min-h-screen bg-background"> 

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        
        {/* 2a. Hero Section: Full width, Neobrutalist container */}
        <section className="relative h-96 md:h-[400px] bg-secondary border-b-4 border-foreground shadow-2xl shadow-primary/50 mb-12">
            
            {/* Background Image Grid */}
            <div className="absolute inset-0 grid grid-cols-3 opacity-60">
                <div className="bg-cover bg-center" style={{ backgroundImage: `url(${FOOD_IMAGE_1})` }}></div>
                <div className="bg-cover bg-center" style={{ backgroundImage: `url(${FOOD_IMAGE_2})` }}></div>
                <div className="bg-cover bg-center" style={{ backgroundImage: `url(${FOOD_IMAGE_3})` }}></div>
            </div>

            {/* Overlay and Call to Action */}
            <div className="relative flex flex-col items-center justify-center h-full text-center p-4">
                <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase mb-6 bg-secondary/80 p-2 border-4 border-foreground shadow-xl shadow-primary/50">
                    Campus Eats, Delivered.
                </h1>
                
                {/* Eat Now Button - Links to Menu Page */}
                <Link to="/menu" className="action-button-neobrutal">
                    👉 EAT NOW!
                </Link>
            </div>
        </section>

        {/* 2b. Content Sections */}
        <div className="p-4 md:p-8 space-y-12">
            
            {/* Full Menu Section */}
            <section className="section-neobrutal bg-secondary">
                <h3 className="section-title">🍜 Menu Highlights</h3>
                <p className="text-gray-600">See what's hot and ready to order today.</p>
                <div className="flex justify-center mt-4">
                    <Link to="/menu" className="nav-button-primary">View Full Menu</Link>
                </div>
            </section>

            {/* Categories Section */}
            <section className="section-neobrutal bg-primary/20">
                <h3 className="section-title text-foreground">🍔 Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <CategoryCard name="Burgers" />
                    <CategoryCard name="Veggies" />
                    <CategoryCard name="Desserts" />
                    <CategoryCard name="Drinks" />
                </div>
            </section>
            
            {/* Quick Eats Section */}
            <section className="section-neobrutal bg-secondary">
                <h3 className="section-title">⚡ Quick Eats</h3>
                <p className="text-gray-600">Need something fast? Grab a quick snack!</p>
                <div className="flex justify-center mt-4">
                    <Link to="/menu" className="nav-button-secondary">Browse Quick Snacks</Link>
                </div>
            </section>

        </div>
      </main>
      
    </div>
  );
};

// --- Helper Components (Kept simple for clarity) ---

const CategoryCard = ({ name }) => (
    <div className="p-4 text-center bg-secondary border-2 border-foreground shadow-md shadow-primary/50 rounded-lg hover:bg-primary/30 transition transform hover:scale-[1.02]">
        <p className="font-semibold text-foreground">{name}</p>
    </div>
);

export default HomePage;
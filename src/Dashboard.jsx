import React from 'react';

function Dashboard({ user, onListClick, onBrowseClick, onMyBookingsClick, onOwnerBookingsClick, onMyItemsClick, onAdminClick, onLogout }) {
  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">📦 DIBS</div>
        <div className="user-greeting">Welcome, {user?.full_name}!</div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </nav>

      <div className="dashboard-hero">
        <h1>What would you like to do?</h1>
        <p>Explore the DIBS community — list, rent, and connect.</p>
      </div>

      <div className="choice-grid">
        <div className="choice-card" onClick={onBrowseClick}>
          <div className="icon">🔍</div>
          <h3>Browse Items</h3>
          <p>Find what you need from community members.</p>
          <button className="cta-button">Explore</button>
        </div>

        <div className="choice-card" onClick={onListClick}>
          <div className="icon">📦</div>
          <h3>List an Item</h3>
          <p>Earn by sharing your unused items.</p>
          <button className="cta-button">List Now</button>
        </div>

        <div className="choice-card" onClick={onMyItemsClick}>
          <div className="icon">🗂️</div>
          <h3>My Listings</h3>
          <p>Manage your items and availability.</p>
          <button className="secondary-button">View</button>
        </div>

        <div className="choice-card" onClick={onMyBookingsClick}>
          <div className="icon">🛒</div>
          <h3>My Bookings</h3>
          <p>Track items you have rented or requested.</p>
          <button className="secondary-button">View</button>
        </div>

        <div className="choice-card" onClick={onOwnerBookingsClick}>
          <div className="icon">📋</div>
          <h3>Booking Requests</h3>
          <p>Approve or reject bookings on your items.</p>
          <button className="secondary-button">Manage</button>
        </div>

        {user?.is_admin && (
          <div className="choice-card admin-card" onClick={onAdminClick}>
            <div className="icon">⚙️</div>
            <h3>Admin Panel</h3>
            <p>Manage users, items, and platform stats.</p>
            <button className="cta-button">Open</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
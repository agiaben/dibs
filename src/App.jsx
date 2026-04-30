import React, { useState, useEffect } from 'react';
import './App.css';
 
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import ListItems from './ListItems';
import BrowseItems from './BrowseItems';
import ItemDetail from './ItemDetail';
import MyBookings from './MyBookings';
import OwnerBookings from './OwnerBookings';
import MyItems from './MyItems';
import AdminPanel from './AdminPanel';
 
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [selectedItemId, setSelectedItemId] = useState(null);
 
  // Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('dibs_user');
    const savedToken = localStorage.getItem('dibs_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);
 
  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('dibs_user', JSON.stringify(userData));
    localStorage.setItem('dibs_token', token);
    setView('dashboard');
  };
 
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dibs_user');
    localStorage.removeItem('dibs_token');
    setView('landing');
  };
 
  const openItemDetail = (itemId) => {
    setSelectedItemId(itemId);
    setView('item-detail');
  };
 
  return (
    <div className="App">
 
      {/* LANDING */}
      {view === 'landing' && (
        <div className="landing-page">
          <nav className="navbar">
            <div className="logo">📦 DIBS</div>
            <ul className="nav-links">
              <li onClick={() => setView('browse')}>Browse Items</li>
              <li onClick={() => setView('login')}>Login</li>
              <li onClick={() => setView('register')}>Register</li>
            </ul>
          </nav>
          <header className="hero">
            <h1>Access More, Own Less</h1>
            <p>Borrow and share items within your community — sustainably and affordably.</p>
            <div className="hero-buttons">
              <button className="cta-button" onClick={() => setView('register')}>Get Started</button>
              <button className="secondary-button" onClick={() => setView('browse')}>Browse Items</button>
            </div>
          </header>
          <section className="features">
            <div className="feature-card">
              <span>📦</span><h3>List Items</h3>
              <p>Earn by sharing things you're not using right now.</p>
            </div>
            <div className="feature-card">
              <span>🔍</span><h3>Find & Rent</h3>
              <p>Find what you need from neighbours at a fraction of the cost.</p>
            </div>
            <div className="feature-card">
              <span>⭐</span><h3>Review & Trust</h3>
              <p>Ratings and reviews keep the community accountable.</p>
            </div>
          </section>
        </div>
      )}
 
      {/* LOGIN */}
      {view === 'login' && (
        <Login
          onBack={() => setView('landing')}
          onRegister={() => setView('register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
 
      {/* REGISTER */}
      {view === 'register' && (
        <Register
          onBack={() => setView('login')}
          onRegisterSuccess={() => {
            alert('Registration successful! Please log in.');
            setView('login');
          }}
        />
      )}
 
      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <Dashboard
          user={user}
          onListClick={() => setView('list-item')}
          onBrowseClick={() => setView('browse')}
          onMyBookingsClick={() => setView('my-bookings')}
          onOwnerBookingsClick={() => setView('owner-bookings')}
          onMyItemsClick={() => setView('my-items')}
          onAdminClick={() => setView('admin')}
          onLogout={handleLogout}
        />
      )}
 
      {/* BROWSE ITEMS */}
      {view === 'browse' && (
        <BrowseItems
          user={user}
          onBack={() => setView(user ? 'dashboard' : 'landing')}
          onViewItem={openItemDetail}
          onLogin={() => setView('login')}
        />
      )}
 
      {/* ITEM DETAIL */}
      {view === 'item-detail' && (
        <ItemDetail
          itemId={selectedItemId}
          user={user}
          onBack={() => setView('browse')}
          onLogin={() => setView('login')}
        />
      )}
 
      {/* LIST ITEM */}
      {view === 'list-item' && user && (
        <ListItems
          user={user}
          onBack={() => setView('dashboard')}
          onSuccess={() => {
            alert('Item listed successfully!');
            setView('my-items');
          }}
        />
      )}
 
      {/* MY BOOKINGS (as renter) */}
      {view === 'my-bookings' && user && (
        <MyBookings
          user={user}
          onBack={() => setView('dashboard')}
          onViewItem={openItemDetail}
        />
      )}
 
      {/* OWNER BOOKINGS (manage bookings on my items) */}
      {view === 'owner-bookings' && user && (
        <OwnerBookings
          user={user}
          onBack={() => setView('dashboard')}
        />
      )}
 
      {/* MY ITEMS */}
      {view === 'my-items' && user && (
        <MyItems
          user={user}
          onBack={() => setView('dashboard')}
          onAddNew={() => setView('list-item')}
        />
      )}
 
      {/* ADMIN PANEL */}
      {view === 'admin' && user?.is_admin && (
        <AdminPanel
          user={user}
          onBack={() => setView('dashboard')}
        />
      )}
 
    </div>
  );
}
 
export default App;

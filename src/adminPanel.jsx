import React, { useState, useEffect } from 'react';
import { getToken } from './api';

function AdminPanel({ user, onBack }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    fetch('http://localhost:5000/admin/stats', {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then((r) => r.json()).then(setStats).catch(() => {});

    fetch('http://localhost:5000/admin/users', {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then((r) => r.json()).then(setUsers).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>⚙️ Admin Panel</h2>
      </div>

      <div className="tab-bar">
        <button className={tab === 'stats' ? 'tab active' : 'tab'} onClick={() => setTab('stats')}>Stats</button>
        <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card"><h3>{stats.total_users}</h3><p>Total Users</p></div>
          <div className="stat-card"><h3>{stats.total_items}</h3><p>Total Items</p></div>
          <div className="stat-card"><h3>{stats.total_bookings}</h3><p>Total Bookings</p></div>
          <div className="stat-card"><h3>{stats.active_bookings}</h3><p>Active Bookings</p></div>
          <div className="stat-card"><h3>{stats.pending_bookings}</h3><p>Pending Requests</p></div>
          <div className="stat-card"><h3>{stats.total_feedback}</h3><p>Reviews</p></div>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-users-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><span className={`badge ${u.is_admin ? 'badge-admin' : ''}`}>{u.is_admin ? 'Admin' : 'User'}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
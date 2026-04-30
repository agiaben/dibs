import React, { useState, useEffect } from 'react';
import { getToken } from './api';

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Approved: '#10b981',
  Rejected: '#ef4444',
  Completed: '#6366f1',
  Cancelled: '#9ca3af'
};

function MyBookings({ user, onBack, onViewItem }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/bookings/my', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then((r) => r.json())
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    const res = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) {
      setBookings((prev) => prev.map((b) =>
        b.booking_id === bookingId ? { ...b, status: 'Cancelled' } : b
      ));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>My Bookings</h2>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">You have no bookings yet.</div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.booking_id} className="booking-card">
              <div className="booking-info">
                <h3 onClick={() => onViewItem(b.item_id)} className="item-link">
                  {b.item_name}
                </h3>
                <p>📅 {b.start_date} → {b.end_date}</p>
                <p>💰 Total: ₹{b.total_cost}</p>
              </div>
              <div className="booking-status">
                <span className="status-badge" style={{ background: STATUS_COLORS[b.status] }}>
                  {b.status}
                </span>
                {b.status === 'Pending' && (
                  <button className="danger-btn" onClick={() => handleCancel(b.booking_id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
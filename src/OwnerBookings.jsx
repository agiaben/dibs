import React, { useState, useEffect } from 'react';
import { getToken } from './api';

const STATUS_COLORS = {
  Pending: '#f59e0b', Approved: '#10b981',
  Rejected: '#ef4444', Completed: '#6366f1', Cancelled: '#9ca3af'
};

function OwnerBookings({ user, onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/bookings/owner', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then((r) => r.json())
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (bookingId, status) => {
    const res = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) {
      setBookings((prev) => prev.map((b) =>
        b.booking_id === bookingId ? { ...b, status } : b
      ));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Booking Requests on My Items</h2>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No booking requests yet.</div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.booking_id} className="booking-card">
              <div className="booking-info">
                <h3>{b.item_name}</h3>
                <p>👤 Renter: {b.renter_name}</p>
                <p>📅 {b.start_date} → {b.end_date}</p>
                <p>💰 ₹{b.total_cost}</p>
              </div>
              <div className="booking-status">
                <span className="status-badge" style={{ background: STATUS_COLORS[b.status] }}>
                  {b.status}
                </span>
                {b.status === 'Pending' && (
                  <div className="action-buttons">
                    <button className="cta-button small" onClick={() => updateStatus(b.booking_id, 'Approved')}>
                      Approve
                    </button>
                    <button className="danger-btn" onClick={() => updateStatus(b.booking_id, 'Rejected')}>
                      Reject
                    </button>
                  </div>
                )}
                {b.status === 'Approved' && (
                  <button className="secondary-button small" onClick={() => updateStatus(b.booking_id, 'Completed')}>
                    Mark Completed
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

export default OwnerBookings;
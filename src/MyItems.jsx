import React, { useState, useEffect } from 'react';
import { getToken } from './api';

function MyItems({ user, onBack, onAddNew }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = () => {
    setLoading(true);
    fetch('http://localhost:5000/items/my', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, []);

  const toggleAvailability = async (item) => {
    const res = await fetch(`http://localhost:5000/items/${item.item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ is_available: !item.is_available })
    });
    if (res.ok) loadItems();
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    const res = await fetch(`http://localhost:5000/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.ok) loadItems();
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>My Listings</h2>
        <button onClick={onAddNew} className="cta-button small">+ Add New</button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>You haven't listed anything yet.</p>
          <button onClick={onAddNew} className="cta-button">List Your First Item</button>
        </div>
      ) : (
        <div className="items-manage-list">
          {items.map((item) => (
            <div key={item.item_id} className="manage-item-card">
              <div className="manage-item-img">
                {item.images && item.images.length > 0
                  ? <img src={`http://localhost:5000${item.images[0]}`} alt={item.item_name} />
                  : <div className="no-img">📦</div>}
              </div>
              <div className="manage-item-info">
                <h3>{item.item_name}</h3>
                <p>{item.category_name} • {item.item_condition}</p>
                <p>₹{item.rental_price_per_day}/day • Deposit: ₹{item.deposit_amount}</p>
                {item.avg_rating && <p>⭐ {item.avg_rating} ({item.review_count} reviews)</p>}
              </div>
              <div className="manage-item-actions">
                <span className={`status-badge ${item.is_available ? 'badge-available' : 'badge-unavailable'}`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
                <button className="secondary-button small" onClick={() => toggleAvailability(item)}>
                  {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button className="danger-btn" onClick={() => deleteItem(item.item_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyItems;
import React, { useState, useEffect } from 'react';
import { getToken } from './api';

function ItemDetail({ itemId, user, onBack, onLogin }) {
  const [item, setItem] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [bookingDates, setBookingDates] = useState({ start_date: '', end_date: '' });
  const [newFeedback, setNewFeedback] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    Promise.all([
      fetch(`http://localhost:5000/items/${itemId}`).then((r) => r.json()),
      fetch(`http://localhost:5000/feedback/${itemId}`).then((r) => r.json())
    ])
      .then(([itemData, feedbackData]) => {
        setItem(itemData);
        setFeedbacks(feedbackData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) { onLogin(); return; }
    setBookingLoading(true);
    try {
      const res = await fetch('http://localhost:5000/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ item_id: itemId, ...bookingDates })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Booking submitted! Total cost: ₹${data.total_cost}`);
        setBookingDates({ start_date: '', end_date: '' });
      } else {
        alert(data.message);
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!user) { onLogin(); return; }
    try {
      const res = await fetch('http://localhost:5000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ item_id: itemId, ...newFeedback })
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        // Refresh feedbacks
        const updated = await fetch(`http://localhost:5000/feedback/${itemId}`).then((r) => r.json());
        setFeedbacks(updated);
        setNewFeedback({ rating: 5, comment: '' });
      }
    } catch {
      alert('Error submitting feedback');
    }
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (!item) return <div className="empty-state">Item not found. <button onClick={onBack}>Go back</button></div>;

  const today = new Date().toISOString().split('T')[0];
  const isOwner = user && item.user_id === user.user_id;

  return (
    <div className="detail-page">
      <button onClick={onBack} className="back-btn">← Back to Browse</button>

      <div className="detail-layout">
        {/* Image Gallery */}
        <div className="detail-images">
          {item.images && item.images.length > 0 ? (
            item.images.map((img, i) => (
              <img key={i} src={`http://localhost:5000${img}`} alt={`${item.item_name} ${i + 1}`} />
            ))
          ) : (
            <div className="no-img-lg">📦</div>
          )}
        </div>

        {/* Item Info */}
        <div className="detail-info">
          <h1>{item.item_name}</h1>
          <div className="badges">
            <span className="badge badge-condition">{item.item_condition}</span>
            <span className="badge">{item.category_name}</span>
            <span className={`badge ${item.is_available ? 'badge-available' : 'badge-unavailable'}`}>
              {item.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <p className="item-description">{item.description}</p>

          <div className="price-block">
            <div><strong>Rental:</strong> ₹{item.rental_price_per_day}/day</div>
            <div><strong>Deposit:</strong> ₹{item.deposit_amount}</div>
          </div>

          {item.avg_rating && (
            <div className="rating">⭐ {item.avg_rating} avg ({item.review_count} reviews)</div>
          )}

          <p className="item-owner">Listed by: <strong>{item.owner_name}</strong></p>

          {/* Booking Form */}
          {!isOwner && item.is_available && (
            <form className="booking-form" onSubmit={handleBook}>
              <h3>Book This Item</h3>
              <div className="two-col">
                <div>
                  <label>Start Date</label>
                  <input type="date" min={today}
                    value={bookingDates.start_date}
                    onChange={(e) => setBookingDates({ ...bookingDates, start_date: e.target.value })}
                    required />
                </div>
                <div>
                  <label>End Date</label>
                  <input type="date" min={bookingDates.start_date || today}
                    value={bookingDates.end_date}
                    onChange={(e) => setBookingDates({ ...bookingDates, end_date: e.target.value })}
                    required />
                </div>
              </div>
              {bookingDates.start_date && bookingDates.end_date && (
                <p className="cost-estimate">
                  Estimated cost: ₹{(
                    Math.max(0, (new Date(bookingDates.end_date) - new Date(bookingDates.start_date)) / 86400000)
                    * item.rental_price_per_day
                  ).toFixed(2)} + ₹{item.deposit_amount} deposit
                </p>
              )}
              <button type="submit" className="cta-button" disabled={bookingLoading}>
                {user ? (bookingLoading ? 'Submitting…' : 'Request Booking') : 'Login to Book'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Reviews ({feedbacks.length})</h2>

        {feedbacks.length === 0 ? (
          <p className="empty-state">No reviews yet.</p>
        ) : (
          <div className="reviews-list">
            {feedbacks.map((f) => (
              <div key={f.feedback_id} className="review-card">
                <div className="review-header">
                  <strong>{f.reviewer_name}</strong>
                  <span>{'⭐'.repeat(f.rating)}</span>
                  <small>{new Date(f.created_at).toLocaleDateString()}</small>
                </div>
                <p>{f.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Review */}
        {user && !isOwner && (
          <form className="feedback-form" onSubmit={handleFeedback}>
            <h3>Leave a Review</h3>
            <p className="hint-text">Only available after a completed rental.</p>
            <label>Rating</label>
            <select value={newFeedback.rating}
              onChange={(e) => setNewFeedback({ ...newFeedback, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>
              ))}
            </select>
            <label>Comment</label>
            <textarea placeholder="Share your experience…" rows={3}
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })} />
            <button type="submit" className="cta-button">Submit Review</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
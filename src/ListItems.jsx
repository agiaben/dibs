import React, { useState, useEffect } from 'react';
import { getToken } from './api';

function ListItems({ user, onBack, onSuccess }) {
  const [itemData, setItemData] = useState({
    name: '', description: '', condition: 'Good',
    deposit: '', rental_price: '', category_id: ''
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setItemData({ ...itemData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemData.category_id) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', itemData.name);
    formData.append('description', itemData.description);
    formData.append('condition', itemData.condition);
    formData.append('deposit', itemData.deposit || 0);
    formData.append('rental_price', itemData.rental_price || 0);
    formData.append('category_id', itemData.category_id);

    for (const img of images) {
      formData.append('images', img);
    }

    try {
      const response = await fetch('http://localhost:5000/add_item', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        onSuccess();
      } else {
        alert(result.message || 'Error listing item');
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>List an Item for Rent</h2>
      </div>

      <form onSubmit={handleSubmit} className="item-form">
        <label>Item Name *</label>
        <input type="text" name="name" placeholder="e.g. Power Drill"
          value={itemData.name} onChange={handleChange} required />

        <label>Category *</label>
        <select name="category_id" value={itemData.category_id} onChange={handleChange} required>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>Description</label>
        <textarea name="description" placeholder="Describe your item, what's included, any terms…"
          value={itemData.description} onChange={handleChange} rows={4} />

        <label>Condition</label>
        <select name="condition" value={itemData.condition} onChange={handleChange}>
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Used">Used</option>
        </select>

        <div className="two-col">
          <div>
            <label>Rental Price / Day (₹) *</label>
            <input type="number" name="rental_price" placeholder="0.00" min="0"
              value={itemData.rental_price} onChange={handleChange} required />
          </div>
          <div>
            <label>Security Deposit (₹)</label>
            <input type="number" name="deposit" placeholder="0.00" min="0"
              value={itemData.deposit} onChange={handleChange} />
          </div>
        </div>

        <label>Photos (optional)</label>
        <input type="file" accept="image/*" multiple
          onChange={(e) => setImages(Array.from(e.target.files))} />
        {images.length > 0 && (
          <p className="hint-text">{images.length} file(s) selected</p>
        )}

        <div className="form-buttons">
          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Posting…' : 'Post Listing'}
          </button>
          <button type="button" onClick={onBack} className="secondary-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default ListItems;
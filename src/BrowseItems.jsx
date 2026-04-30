import React, { useState, useEffect } from 'react';

function BrowseItems({ user, onBack, onViewItem, onLogin }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadItems();
  }, [categoryId, condition]);

  const loadItems = async (searchTerm = search) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (categoryId) params.set('category_id', categoryId);
    if (condition) params.set('condition', condition);

    try {
      const res = await fetch(`http://localhost:5000/items?${params}`);
      const data = await res.json();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadItems(search);
  };

  return (
    <div className="browse-page">
      <div className="browse-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Browse Items</h2>
        {!user && (
          <button onClick={onLogin} className="cta-button small">Login to Rent</button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="cta-button small">Search</button>
      </form>

      <div className="filter-row">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="">Any Condition</option>
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Used">Used</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading items…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No items found. Try a different search.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.item_id} className="item-card" onClick={() => onViewItem(item.item_id)}>
              <div className="item-img">
                {item.images && item.images.length > 0 ? (
                  <img src={`http://localhost:5000${item.images[0]}`} alt={item.item_name} />
                ) : (
                  <div className="no-img">📦</div>
                )}
              </div>
              <div className="item-info">
                <h3>{item.item_name}</h3>
                <span className="badge badge-condition">{item.item_condition}</span>
                <span className="badge">{item.category_name}</span>
                <div className="item-price">₹{item.rental_price_per_day}/day</div>
                {item.avg_rating && (
                  <div className="rating">⭐ {item.avg_rating} ({item.review_count})</div>
                )}
                <p className="item-owner">By {item.owner_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowseItems;
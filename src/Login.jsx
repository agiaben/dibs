import React, { useState } from 'react';

function Login({ onBack, onRegister, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        onLoginSuccess(
          { user_id: result.user_id, full_name: result.full_name, is_admin: result.is_admin },
          result.token
        );
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch {
      setError('Could not connect to server. Is Flask running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login to DIBS</h2>
        <p>Welcome back!</p>

        {error && <div className="error-banner">{error}</div>}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        <button type="submit" className="cta-button" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>

        <p className="toggle-text" onClick={onRegister}>
          Don't have an account? <strong>Register</strong>
        </p>
        <p className="toggle-text" onClick={onBack}>
          ← Back to Home
        </p>
      </form>
    </div>
  );
}

export default Login;
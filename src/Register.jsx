import React, { useState } from 'react';

function Register({ onBack, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pw);
  const validatePhone = (ph) => /^\d{10}$/.test(ph);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value) ? '' : 'Password must have 8+ chars, uppercase, lowercase, number & special char'
      }));
    }
    if (name === 'phone') {
      setErrors((prev) => ({
        ...prev,
        phone: validatePhone(value) ? '' : 'Phone must be exactly 10 digits'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(formData.password)) {
      setErrors((prev) => ({ ...prev, password: 'Invalid password format' }));
      return;
    }
    if (!validatePhone(formData.phone)) {
      setErrors((prev) => ({ ...prev, phone: 'Phone must be exactly 10 digits' }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        onRegisterSuccess(); // FIX: notify parent for redirection
      } else {
        alert(result.message);
      }
    } catch {
      alert('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form registration-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p>Join DIBS today</p>

        <input type="text" name="fullName" placeholder="Full Name"
          value={formData.fullName} onChange={handleChange} required />

        <input type="email" name="email" placeholder="Email Address"
          value={formData.email} onChange={handleChange} required />

        <input type="tel" name="phone" placeholder="Phone (10 digits)"
          value={formData.phone} onChange={handleChange} required />
        {errors.phone && <p className="field-error">{errors.phone}</p>}

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
        <p className="hint-text">8+ chars • uppercase • lowercase • number • special character</p>
        {errors.password && <p className="field-error">{errors.password}</p>}

        <textarea name="address" placeholder="Your Address"
          value={formData.address} onChange={handleChange} required />

        <button type="submit" className="cta-button" disabled={loading}>
          {loading ? 'Registering…' : 'Register'}
        </button>

        <p className="toggle-text" onClick={onBack}>
          Already have an account? <strong>Login</strong>
        </p>
      </form>
    </div>
  );
}

export default Register;
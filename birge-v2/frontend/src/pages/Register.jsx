import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('volunteer');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(email, password, role, phone);
    if (result.success) {
      alert('Регистрация успешна! Подтвердите email по коду, отправленному на почту, затем войдите.');
      navigate('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h2>Регистрация в Birge</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Роль</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: 8, margin: '8px 0' }}>
            <option value="volunteer">Волонтёр</option>
            <option value="organization">Организация</option>
            <option value="educational_institution">Учебное заведение</option>
          </select>
        </div>
        <div>
          <label>Телефон (опционально)</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none' }}>
          Зарегистрироваться
        </button>
      </form>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  );
};

export default Register;

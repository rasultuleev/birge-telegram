import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('https://birge-backend-v2-1.onrender.com/api/events/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(res.data);
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки мероприятий');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegister = (code) => {
    navigate(`/scan?code=${code}`);
  };

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <h2>Активные мероприятия</h2>
      <button onClick={() => navigate('/profile')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад в профиль
      </button>
      {loading ? (
        <p>Загрузка...</p>
      ) : events.length === 0 ? (
        <p>На данный момент нет активных мероприятий.</p>
      ) : (
        events.map(ev => (
          <div key={ev.id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 15, borderRadius: 8, background: '#fafafa' }}>
            <h3>{ev.title}</h3>
            <p>{ev.description}</p>
            <p><strong>Дата начала:</strong> {new Date(ev.date_start).toLocaleString()}</p>
            <p><strong>Макс. часов:</strong> {ev.max_hours}</p>
            <button onClick={() => handleRegister(ev.code)} style={{ padding: '8px 16px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 5 }}>
              Зарегистрироваться
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default EventsList;

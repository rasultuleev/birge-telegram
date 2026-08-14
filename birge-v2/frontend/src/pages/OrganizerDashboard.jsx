import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (!user || (user.role !== 'organization' && user.role !== 'educational_institution')) {
    navigate('/profile');
    return null;
  }

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2>Мои мероприятия</h2>
        <div>
          <button onClick={() => navigate('/events/create')} style={{ padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
            + Создать мероприятие
          </button>
          {user.role === 'educational_institution' && (
            <>
              <button onClick={() => navigate('/institutions/import')} style={{ marginLeft: 10, padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8 }}>
                📥 Импорт студентов
              </button>
              <button onClick={() => navigate('/institutions/report')} style={{ marginLeft: 10, padding: '10px 20px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: 8 }}>
                📊 Отчёт
              </button>
            </>
          )}
        </div>
      </div>
      <button onClick={logout} style={{ marginTop: 10, background: '#c62828', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        Выйти
      </button>

      {loading ? (
        <p>Загрузка...</p>
      ) : events.length === 0 ? (
        <p style={{ marginTop: 30 }}>У вас пока нет мероприятий. Создайте первое!</p>
      ) : (
        <div style={{ marginTop: 30 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 15, borderRadius: 8, background: '#fafafa', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <h3>{ev.title}</h3>
                <p>{ev.description}</p>
                <p><strong>Код:</strong> {ev.code}</p>
                <p><strong>Дата начала:</strong> {new Date(ev.date_start).toLocaleString()}</p>
                <p><strong>Макс. часов:</strong> {ev.max_hours}</p>
                <Link to={`/events/${ev.id}/participants`} style={{ color: '#2c5f8a' }}>Посмотреть участников</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeSVG value={ev.code} size={120} />
                <span style={{ fontSize: 12, marginTop: 5 }}>QR-код мероприятия</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;

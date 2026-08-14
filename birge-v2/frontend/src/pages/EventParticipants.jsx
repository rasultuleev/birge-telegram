import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EventParticipants = () => {
  const { id } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`'https://birge-backend-v2-1.onrender.com/api'/events/${id}/participants/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setParticipants(res.data);
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки участников');
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [id]);

  const verifyHours = async (participationId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `'https://birge-backend-v2-1.onrender.com/api'/participations/${participationId}/verify/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Часы подтверждены');
      // Обновляем список
      const res = await axios.get(`'https://birge-backend-v2-1.onrender.com/api'/events/${id}/participants/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(res.data);
    } catch (err) {
      alert('Ошибка подтверждения');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <h2>Участники мероприятия</h2>
      <button onClick={() => navigate('/organizer')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад
      </button>
      {participants.length === 0 ? (
        <p>Нет участников</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Волонтёр</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Часы</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Статус</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 10 }}>
                  <Link to={`/volunteer/${p.volunteer}`} style={{ color: '#2c5f8a' }}>
                    {p.volunteer_name}
                  </Link>
                </td>
                <td style={{ padding: 10 }}>{p.hours}</td>
                <td style={{ padding: 10 }}>{p.verified ? '✅ Подтверждено' : '⏳ Не подтверждено'}</td>
                <td style={{ padding: 10 }}>
                  {!p.verified && (
                    <button onClick={() => verifyHours(p.id)} style={{ background: '#4caf50', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 5 }}>
                      Подтвердить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EventParticipants;

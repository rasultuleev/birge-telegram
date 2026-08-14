import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CreateEvent = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [maxHours, setMaxHours] = useState(4);
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        'https://birge-backend-v2-1.onrender.com/api/events/',
        {
          title,
          description,
          date_start: new Date(dateStart).toISOString(),
          date_end: new Date(dateEnd).toISOString(),
          max_hours: maxHours,
          skill_ids: [],
          notify_volunteers: notify
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Мероприятие создано!');
      navigate('/organizer');
    } catch (err) {
      alert('Ошибка создания: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>Создать мероприятие</h2>
      <button onClick={() => navigate('/organizer')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад
      </button>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Дата начала</label>
          <input
            type="datetime-local"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Дата окончания</label>
          <input
            type="datetime-local"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            required
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div>
          <label>Максимальное количество часов</label>
          <input
            type="number"
            value={maxHours}
            onChange={(e) => setMaxHours(parseInt(e.target.value) || 0)}
            min="1"
            style={{ width: '100%', padding: 8, margin: '8px 0' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            Уведомить волонтёров по email
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
          {loading ? 'Создание...' : 'Создать'}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;

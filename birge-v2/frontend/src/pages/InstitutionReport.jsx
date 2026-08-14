import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InstitutionReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('https://birge-backend-v2-1.onrender.com/api/institutions/report/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки отчёта');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const downloadCSV = () => {
    const headers = ['Email', 'Имя', 'Фамилия', 'Группа', 'Телефон', 'Всего часов', 'Навыки', 'Мероприятия'];
    const rows = students.map(s => [
      s.email,
      s.first_name,
      s.last_name,
      s.group_name,
      s.phone,
      s.total_hours,
      s.skills.map(sk => `${sk.name} (${sk.level})`).join('; '),
      s.participations.map(p => `${p.title} (${p.hours} ч.)`).join('; ')
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', padding: 20 }}>
      <h2>Отчёт по студентам</h2>
      <button onClick={() => navigate('/organizer')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад
      </button>
      <button onClick={downloadCSV} style={{ marginBottom: 20, marginLeft: 10, background: '#2c5f8a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8 }}>
        📥 Скачать CSV
      </button>
      {loading ? (
        <p>Загрузка...</p>
      ) : students.length === 0 ? (
        <p>Нет студентов</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Имя</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Группа</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Часы</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Навыки</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 8 }}>{s.email}</td>
                <td style={{ padding: 8 }}>{s.first_name} {s.last_name}</td>
                <td style={{ padding: 8 }}>{s.group_name}</td>
                <td style={{ padding: 8 }}>{s.total_hours}</td>
                <td style={{ padding: 8 }}>{s.skills.map(sk => `${sk.name}(${sk.level})`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InstitutionReport;

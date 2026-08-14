import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ImportStudents = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Выберите файл');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('https://birge-backend-v2-1.onrender.com/api/institutions/import-students/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>Импорт студентов</h2>
      <button onClick={() => navigate('/organizer')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад
      </button>
      <p>Загрузите CSV-файл с колонками: <strong>email, first_name, last_name, group_name</strong></p>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 15 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
          {loading ? 'Загрузка...' : 'Импортировать'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 20, background: '#e8f5e9', padding: 15, borderRadius: 8 }}>
          <p>{result.message}</p>
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4>Ошибки:</h4>
              <ul>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportStudents;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const QrScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const startScanner = () => {
    setScanning(true);
    const scanner = new Html5Qrcode('reader');
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        scanner.stop();
        setScanning(false);
        // decodedText – это код мероприятия (например, 15EF990E)
        try {
          const token = localStorage.getItem('access_token');
          const res = await axios.post(
            'https://birge-backend-v2-1.onrender.com/api/events/participate/',
            { code: decodedText },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMessage('✅ Регистрация успешна!');
          setTimeout(() => navigate('/profile'), 2000);
        } catch (err) {
          setMessage('❌ Ошибка: ' + (err.response?.data?.error || err.message));
        }
      },
      (error) => {
        // игнорируем ошибки сканирования
      }
    ).catch(err => setMessage('❌ Не удалось запустить камеру: ' + err));
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, textAlign: 'center' }}>
      <h2>Сканировать QR-код</h2>
      <button onClick={() => navigate('/profile')} style={{ marginBottom: 20, background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 5 }}>
        ← Назад
      </button>
      <div id="reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}></div>
      {!scanning && (
        <button onClick={startScanner} style={{ marginTop: 20, padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
          📷 Запустить сканер
        </button>
      )}
      {message && <p style={{ marginTop: 20, fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default QrScanner;

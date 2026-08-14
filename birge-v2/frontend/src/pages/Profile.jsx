import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef();

  if (!user) {
    navigate('/login');
    return null;
  }

  const volunteerId = user.volunteer_profile_id; // если есть, иначе можно получить через дополнительный запрос, но пока предположим, что у волонтёра есть id профиля
  const publicUrl = `${window.location.origin}/volunteer/${volunteerId}`;

  // Функция скачивания QR-кода как PNG
  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr_${user.email}.png`;
      link.href = png;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>Профиль</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Роль:</strong> {user.role}</p>
      <p><strong>Телефон:</strong> {user.phone || 'не указан'}</p>
      <p><strong>Подтверждён:</strong> {user.is_verified ? 'Да' : 'Нет'}</p>

      {user.role === 'volunteer' && (
        <div>
          <button onClick={() => navigate('/events')} style={{ marginTop: 10, padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
            📋 Мероприятия
          </button>
          <button onClick={() => navigate('/scan')} style={{ marginTop: 10, marginLeft: 10, padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8 }}>
            📷 Сканировать QR
          </button>
          {volunteerId && (
            <div style={{ marginTop: 20 }}>
              <h4>Ваш QR-код профиля</h4>
              <div ref={qrRef}>
                <QRCodeSVG value={publicUrl} size={150} />
              </div>
              <button onClick={downloadQR} style={{ marginTop: 10, padding: '5px 15px', background: '#555', color: '#fff', border: 'none', borderRadius: 5 }}>
                Скачать QR
              </button>
              <p style={{ fontSize: 12, marginTop: 10 }}>Ссылка на портфолио: <a href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}</a></p>
            </div>
          )}
        </div>
      )}

      {(user.role === 'organization' || user.role === 'educational_institution') && (
        <button onClick={() => navigate('/organizer')} style={{ marginTop: 10, padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
          📋 Панель организатора
        </button>
      )}

      <button onClick={logout} style={{ marginTop: 20, padding: '10px 20px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 8 }}>
        Выйти
      </button>
    </div>
  );
};

export default Profile;

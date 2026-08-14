import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VolunteerPublicProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`'https://birge-backend-v2-1.onrender.com/api'/volunteers/${id}/`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки портфолио');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const downloadPDF = () => {
    const input = contentRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`portfoli_${profile.full_name || profile.email}.pdf`);
    });
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;
  if (!profile) return <div style={{ padding: 20 }}>Портфолио не найдено</div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div ref={contentRef}>
        <h2>{profile.full_name}</h2>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Телефон:</strong> {profile.phone || 'не указан'}</p>
        <p><strong>Учебное заведение:</strong> {profile.institution_name || 'не указано'}</p>
        <p><strong>Группа:</strong> {profile.group_name || 'не указана'}</p>
        <p><strong>Всего часов:</strong> {profile.total_hours}</p>

        <h3>Навыки</h3>
        {profile.skills && profile.skills.length > 0 ? (
          <ul>
            {profile.skills.map((s, i) => (
              <li key={i}>{s.name} – уровень {s.level}</li>
            ))}
          </ul>
        ) : <p>Навыки не указаны</p>}

        <h3>Подтверждённые мероприятия</h3>
        {profile.participations && profile.participations.length > 0 ? (
          <ul>
            {profile.participations.map((p, i) => (
              <li key={i}>
                <strong>{p.event_title}</strong> – {p.hours} ч. (организатор: {p.organizer || 'неизвестен'})
              </li>
            ))}
          </ul>
        ) : <p>Нет подтверждённых мероприятий</p>}
      </div>

      <button onClick={downloadPDF} style={{ marginTop: 20, padding: '10px 20px', background: '#2c5f8a', color: '#fff', border: 'none', borderRadius: 8 }}>
        📄 Скачать PDF
      </button>
    </div>
  );
};

export default VolunteerPublicProfile;

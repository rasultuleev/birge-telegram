import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, StatusBar,
  Alert, ActivityIndicator, Linking, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraView } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import WebQrScanner from './components/WebQrScanner';

const API_URL = 'https://birge-telegram.onrender.com/api';

const BackButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.backButton}>
    <Text style={styles.backButtonText}>← Назад</Text>
  </TouchableOpacity>
);

export default function App() {
  // ---------- СОСТОЯНИЯ ----------
  const [screen, setScreen] = useState('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('university');
  const [institution, setInstitution] = useState('');
  const [groupName, setGroupName] = useState('');

  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    user_type: 'university',
    institution: '',
    group_name: ''
  });

  const [allSkills, setAllSkills] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date_start: '', date_end: '', max_hours: '', code: '', skill_ids: []
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [qrEvent, setQrEvent] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // ---------- ОБНОВЛЕНИЕ editData ПРИ ПЕРЕХОДЕ НА ЭКРАН РЕДАКТИРОВАНИЯ ----------
  useEffect(() => {
    if (screen === 'edit' && profile) {
      setEditData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        user_type: profile.user_type || 'university',
        institution: profile.institution || '',
        group_name: profile.group_name || ''
      });
    }
  }, [screen, profile]);

  // ---------- ТОКЕН ----------
  const saveToken = async (t) => {
    try {
      await AsyncStorage.setItem('userToken', t);
    } catch (e) { console.log('Ошибка сохранения токена:', e); }
  };

  const loadToken = async () => {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (e) { console.log('Ошибка загрузки токена:', e); return null; }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (e) { console.log('Ошибка удаления токена:', e); }
  };

  // ---------- ПРОВЕРКА ВХОДА ----------
  useEffect(() => {
    const checkLogin = async () => {
      const savedToken = await loadToken();
      if (savedToken) {
        setToken(savedToken);
        await fetchProfile(savedToken);
        await fetchSkills();
      }
    };
    checkLogin();
  }, []);

  // ---------- ОТКРЫТЬ TELEGRAM ----------
  const openTelegramBinding = () => {
    if (!phone) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }
    const encodedPhone = encodeURIComponent(phone.trim());
    const url = `tg://resolve?domain=birge_verification_bot&start=phone_${encodedPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Ошибка', 'Установите Telegram или проверьте ссылку');
    });
  };

  // ---------- ЛОГИН ----------
  const handleLogin = async () => {
    if (!phone) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/send-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Успех', 'Код отправлен');
        setScreen('code');
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось отправить код');
      }
    } catch (error) {
      Alert.alert('Ошибка', error.message || 'Проверьте интернет');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Ошибка', 'Введите код');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.access_token);
        await saveToken(data.access_token);
        await fetchProfile(data.access_token);
        await fetchSkills();
      } else {
        Alert.alert('Ошибка', data.error || 'Неверный код');
      }
    } catch (error) {
      Alert.alert('Ошибка', error.message || 'Проверьте интернет');
    }
    setLoading(false);
  };

  const fetchProfile = async (accessToken) => {
    try {
      const res = await fetch(`${API_URL}/profile/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        if (!data.user_type || data.user_type === '') {
          setScreen('chooseRole');
        } else {
          setScreen(data.is_staff ? 'organizerHome' : 'profile');
          if (data.is_staff) {
            await fetchMyEvents(accessToken);
          } else {
            await fetchEvents(accessToken);
          }
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить профиль');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Проверьте интернет');
    }
  };

  const fetchEvents = async (accessToken) => {
    try {
      const res = await fetch(`${API_URL}/events/my/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.status === 403) return;
      const data = await res.json();
      if (res.ok) setEvents(data);
    } catch (e) {}
  };

  const fetchMyEvents = async (accessToken) => {
    try {
      const res = await fetch(`${API_URL}/events/my/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.status === 403) return;
      const data = await res.json();
      if (res.ok) setEvents(data);
    } catch (e) {}
  };

  const fetchSkills = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/skills/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllSkills(data);
    } catch (e) {}
  };

  const handleUpdateProfile = async (data) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        Alert.alert('Успех', 'Профиль обновлён');
        await fetchProfile(token);
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось обновить');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Проверьте интернет');
    }
    setLoading(false);
  };

  const saveRole = async () => {
    await handleUpdateProfile({
      user_type: selectedType,
      institution: institution,
      group_name: groupName
    });
  };

  const handleLogout = async () => {
    await removeToken();
    setToken(null);
    setProfile(null);
    setEvents([]);
    setScreen('login');
  };

  // ---------- ОРГАНИЗАТОР ----------
  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date_start || !newEvent.max_hours) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEvent,
          max_hours: parseInt(newEvent.max_hours),
          date_start: new Date(newEvent.date_start).toISOString(),
          date_end: newEvent.date_end ? new Date(newEvent.date_end).toISOString() : new Date(newEvent.date_start).toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Успех', 'Мероприятие создано');
        setNewEvent({ title: '', description: '', date_start: '', date_end: '', max_hours: '', code: '', skill_ids: [] });
        await fetchMyEvents(token);
        setScreen('organizerHome');
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось создать');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Проверьте интернет');
    }
    setLoading(false);
  };

  const fetchParticipants = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/participants/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setParticipants(data);
    } catch (e) {}
  };

  const handleVerifyParticipation = async (participationId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/participations/${participationId}/verify/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Успех', 'Часы подтверждены');
        if (selectedEvent) await fetchParticipants(selectedEvent.id);
      } else {
        Alert.alert('Ошибка', data.error || 'Не удалось подтвердить');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Проверьте интернет');
    }
    setLoading(false);
  };

  const toggleSkill = (skillId) => {
    if (newEvent.skill_ids.includes(skillId)) {
      setNewEvent({...newEvent, skill_ids: newEvent.skill_ids.filter(id => id !== skillId)});
    } else {
      setNewEvent({...newEvent, skill_ids: [...newEvent.skill_ids, skillId]});
    }
  };

  // ---------- КАМЕРА ----------
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScannerVisible(false);
    const eventCode = data.includes('birge://register/') ? data.split('/').pop() : data;
    try {
      const res = await fetch(`${API_URL}/register-event/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: eventCode, hours: 4 })
      });
      const result = await res.json();
      if (res.ok) {
        Alert.alert('Успех', 'Вы зарегистрированы');
        await fetchProfile(token);
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось зарегистрироваться');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Проверьте интернет');
    }
  };

  // ---------- РЕНДЕРИНГ ----------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5f8a" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  // ----- ЛОГИН -----
  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f2eb" />
        <View style={styles.content}>
          <Text style={styles.title}>🌍 Birge</Text>
          <Text style={styles.subtitle}>Твоё цифровое портфолио</Text>
          <TextInput
            style={styles.input}
            placeholder="Номер телефона"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={handleLogin}>
              <Text style={styles.buttonText}>Получить код</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton, styles.telegramButton]} onPress={openTelegramBinding}>
              <Text style={styles.buttonText}>📱 Привязать Telegram</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ----- КОД -----
  if (screen === 'code') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('login')} />
        <View style={styles.content}>
          <Text style={styles.title}>Код подтверждения</Text>
          <Text style={styles.subtitle}>Отправили на {phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите код"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ----- ВЫБОР РОЛИ -----
  if (screen === 'chooseRole') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('login')} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.title}>Кто вы?</Text>
          <View style={styles.pickerContainer}>
            {['school','college','university','graduate','other'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, selectedType === type && styles.pickerOptionSelected]}
                onPress={() => setSelectedType(type)}
              >
                <Text>{type === 'school' ? 'Школьник' : type === 'college' ? 'Студент колледжа' : type === 'university' ? 'Студент вуза' : type === 'graduate' ? 'Выпускник' : 'Другое'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Учебное заведение" value={institution} onChangeText={setInstitution} />
          <TextInput style={styles.input} placeholder="Группа/Класс" value={groupName} onChangeText={setGroupName} />
          <TouchableOpacity style={styles.button} onPress={saveRole}>
            <Text style={styles.buttonText}>Продолжить</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- ПРОФИЛЬ -----
  if (screen === 'profile') {
    if (!profile) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c5f8a" />
            <Text style={styles.loadingText}>Загрузка профиля...</Text>
          </View>
        </SafeAreaView>
      );
    }
    const skills = profile.skills || [];
    const eventsList = events || [];
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('login')} />
        <ScrollView>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.first_name ? profile.first_name[0] : 'С'}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.last_name} {profile?.first_name}</Text>
            <Text style={styles.university}>{profile?.institution}</Text>
            <Text style={styles.group}>{profile?.group_name}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setScreen('edit')}>
              <Text style={styles.editButtonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
              <Text style={styles.scanButtonText}>📷 Сканировать QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Выйти</Text>
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.total_hours || 0}</Text>
                <Text style={styles.statLabel}>часов</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{skills.length || 0}</Text>
                <Text style={styles.statLabel}>навыков</Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Мои навыки</Text>
            {skills.length > 0 ? (
              skills.map((skill, idx) => (
                <View key={idx} style={styles.skillRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.stars}>{'⭐'.repeat(skill.level)}{'☆'.repeat(3 - skill.level)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Пока нет навыков</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Мои мероприятия</Text>
            {eventsList.length > 0 ? (
              eventsList.map((ev, idx) => (
                <View key={idx} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventDate}>{ev.date_start}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Вы ещё не участвовали</Text>
            )}
          </View>
        </ScrollView>
        {scannerVisible && (
          <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {Platform.OS === 'web' ? (
              <WebQrScanner
                onScan={(data) => {
                  setScannerVisible(false);
                  const eventCode = data.includes('birge://register/') ? data.split('/').pop() : data;
                  handleBarCodeScanned({ data: eventCode });
                }}
                onClose={() => setScannerVisible(false)}
              />
            ) : (
              <>
                <CameraView
                  style={{ flex: 1 }}
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                <TouchableOpacity style={styles.closeScanner} onPress={() => setScannerVisible(false)}>
                  <Text style={styles.closeScannerText}>Закрыть</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ----- РЕДАКТИРОВАНИЕ ПРОФИЛЯ -----
  if (screen === 'edit') {
    const saveEdit = async () => {
      await handleUpdateProfile(editData);
    };

    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('profile')} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.editTitle}>Редактировать профиль</Text>
          <TextInput
            style={styles.input}
            placeholder="Имя"
            value={editData.first_name}
            onChangeText={t => setEditData({...editData, first_name: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Фамилия"
            value={editData.last_name}
            onChangeText={t => setEditData({...editData, last_name: t})}
          />
          <View style={styles.pickerContainer}>
            <Text>Тип участника</Text>
            <View style={styles.pickerRow}>
              {['school','college','university','graduate','other'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerOption, editData.user_type === type && styles.pickerOptionSelected]}
                  onPress={() => setEditData({...editData, user_type: type})}
                >
                  <Text>
                    {type === 'school' ? 'Школа' :
                     type === 'college' ? 'Колледж' :
                     type === 'university' ? 'Вуз' :
                     type === 'graduate' ? 'Выпускник' : 'Другое'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Учебное заведение"
            value={editData.institution}
            onChangeText={t => setEditData({...editData, institution: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Группа/Класс"
            value={editData.group_name}
            onChangeText={t => setEditData({...editData, group_name: t})}
          />
          <TouchableOpacity style={styles.button} onPress={saveEdit}>
            <Text style={styles.buttonText}>Сохранить</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- ОРГАНИЗАТОР -----
  if (screen === 'organizerHome') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('profile')} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Мои мероприятия</Text>
          <TouchableOpacity onPress={() => setScreen('createEvent')}>
            <Text style={styles.addButton}>➕</Text>
          </TouchableOpacity>
        </View>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>Нет мероприятий</Text>
        ) : (
          events.map(ev => (
            <TouchableOpacity key={ev.id} style={styles.eventCard} onPress={() => {
              setSelectedEvent(ev);
              fetchParticipants(ev.id);
              setScreen('eventParticipants');
            }}>
              <Text style={styles.eventTitle}>{ev.title}</Text>
              <Text>Код: {ev.code}</Text>
              <Text>Навыки: {ev.skills?.join(', ') || 'нет'}</Text>
              <TouchableOpacity style={styles.qrButton} onPress={() => { setQrEvent(ev); setScreen('qrDisplay'); }}>
                <Text style={styles.qrButtonText}>📱 QR</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </SafeAreaView>
    );
  }

  if (screen === 'createEvent') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('organizerHome')} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.editTitle}>Создать мероприятие</Text>
          <TextInput
            style={styles.input}
            placeholder="Название"
            value={newEvent.title}
            onChangeText={t => setNewEvent({...newEvent, title: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Описание"
            value={newEvent.description}
            onChangeText={t => setNewEvent({...newEvent, description: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Дата начала (2026-07-08T10:00)"
            value={newEvent.date_start}
            onChangeText={t => setNewEvent({...newEvent, date_start: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Дата окончания (2026-07-08T18:00)"
            value={newEvent.date_end}
            onChangeText={t => setNewEvent({...newEvent, date_end: t})}
          />
          <TextInput
            style={styles.input}
            placeholder="Макс. часов"
            value={newEvent.max_hours}
            onChangeText={t => setNewEvent({...newEvent, max_hours: t})}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Код (опционально)"
            value={newEvent.code}
            onChangeText={t => setNewEvent({...newEvent, code: t})}
          />
          <Text style={styles.sectionTitle}>Навыки</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {allSkills.map(skill => (
              <TouchableOpacity
                key={skill.id}
                style={[styles.skillChip, newEvent.skill_ids.includes(skill.id) && styles.skillChipSelected]}
                onPress={() => toggleSkill(skill.id)}
              >
                <Text>{skill.name} {newEvent.skill_ids.includes(skill.id) ? '✅' : '⬜'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
            <Text style={styles.buttonText}>Создать</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'eventParticipants') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('organizerHome')} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Участники: {selectedEvent?.title}</Text>
        </View>
        {participants.length === 0 ? (
          <Text style={styles.emptyText}>Нет участников</Text>
        ) : (
          participants.map(p => (
            <View key={p.id} style={styles.participantRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold' }}>{p.participant_name}</Text>
                <Text>{p.user_type} • {p.institution} • {p.group}</Text>
                <Text>Часы: {p.hours}</Text>
              </View>
              {p.verified ? (
                <Text style={{ color: 'green' }}>✅</Text>
              ) : (
                <TouchableOpacity onPress={() => handleVerifyParticipation(p.id)} style={styles.verifyButton}>
                  <Text style={styles.verifyButtonText}>Подтвердить</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </SafeAreaView>
    );
  }

  if (screen === 'qrDisplay') {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={() => setScreen('organizerHome')} />
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>{qrEvent?.title}</Text>
          <QRCode value={qrEvent?.code || ''} size={250} />
          <Text style={styles.qrCode}>{qrEvent?.code}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setScreen('organizerHome')}>
            <Text style={styles.buttonText}>Готово</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2eb' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#2c5f8a', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e0e0e0' },
  button: { backgroundColor: '#2c5f8a', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f2eb' },
  loadingText: { marginTop: 10, color: '#2c5f8a' },
  profileHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2c5f8a', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  university: { fontSize: 16, color: '#666', marginTop: 5 },
  group: { fontSize: 14, color: '#888', marginTop: 2 },
  editButton: { marginTop: 10, backgroundColor: '#2c5f8a20', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  editButtonText: { color: '#2c5f8a', fontWeight: 'bold' },
  scanButton: { marginTop: 10, backgroundColor: '#2c5f8a', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  scanButtonText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { marginTop: 10, backgroundColor: '#c62828', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, alignSelf: 'center' },
  logoutButtonText: { color: '#fff', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, paddingHorizontal: 20 },
  statCard: { alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, minWidth: 90, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#2c5f8a' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  section: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  skillName: { fontSize: 16, color: '#333' },
  stars: { fontSize: 16, color: '#f5b042' },
  eventCard: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 10, marginBottom: 10, marginHorizontal: 20 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  eventDate: { fontSize: 12, color: '#666', marginTop: 5 },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  editTitle: { fontSize: 28, fontWeight: 'bold', color: '#2c5f8a', textAlign: 'center', marginBottom: 20 },
  pickerContainer: { marginBottom: 20 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  pickerOption: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginRight: 5, marginBottom: 5 },
  pickerOptionSelected: { borderColor: '#2c5f8a', backgroundColor: '#2c5f8a20' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  addButton: { fontSize: 30, color: '#2c5f8a' },
  backButton: { position: 'absolute', top: 10, left: 10, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  backButtonText: { fontSize: 16, color: '#2c5f8a', fontWeight: 'bold' },
  qrButton: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: '#2c5f8a20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  qrButtonText: { color: '#2c5f8a' },
  qrContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  qrCode: { marginTop: 10, fontSize: 16, color: '#333' },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', marginHorizontal: 20 },
  verifyButton: { backgroundColor: '#2c5f8a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, alignSelf: 'center' },
  verifyButtonText: { color: '#fff' },
  skillChip: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, margin: 4 },
  skillChipSelected: { borderColor: '#2c5f8a', backgroundColor: '#2c5f8a20' },
  closeScanner: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#2c5f8a', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  closeScannerText: { color: '#fff', fontSize: 16 },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfButton: { flex: 1 },
  telegramButton: { backgroundColor: '#0088cc' },
});
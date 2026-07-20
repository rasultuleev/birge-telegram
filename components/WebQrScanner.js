import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Библиотека для работы с камерой в браузере
const Html5Qrcode = Platform.OS === 'web' ? require('html5-qrcode').Html5Qrcode : null;

export default function WebQrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-container';

  useEffect(() => {
    // Запускаем сканер только на Web
    if (Platform.OS !== 'web') return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scanner
      .start(
        { facingMode: 'environment' }, // используем заднюю камеру
        config,
        (decodedText) => {
          // Успешное сканирование
          if (onScan) onScan(decodedText);
          // Можно остановить сканер после первого успешного сканирования
          // scanner.stop().catch(() => {});
        },
        (error) => {
          // Ошибка при сканировании (например, не найден код)
          if (onError) onError(error);
        }
      )
      .catch((err) => {
        console.warn('Ошибка запуска камеры:', err);
        if (onError) onError(err);
      });

    // Очистка при размонтировании
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current.clear();
          })
          .catch((e) => console.warn('Ошибка остановки сканера:', e));
      }
    };
  }, [onScan, onError]);

  return (
    <View style={styles.container}>
      <View id={containerId} style={styles.reader} />
      <Text style={styles.hint}>Наведите камеру на QR-код</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reader: {
    width: '90%',
    aspectRatio: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});

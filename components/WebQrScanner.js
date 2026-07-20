import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WebQrScanner({ onScan, onError }) {
  // Заглушка — просто показывает текст, что сканер будет позже
  return (
    <View style={styles.container}>
      <Text style={styles.text}>QR-сканер для Web (в разработке)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#333' },
});

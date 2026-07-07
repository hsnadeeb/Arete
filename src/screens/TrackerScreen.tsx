import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Card';
import { PRAYER_NAMES, today } from '../types';
import * as db from '../db/service';

export default function TrackerScreen() {
  const { setSidebarOpen, dailyLog, prayers, logWeight, logWater, logSteps, logMood, togglePrayer, logSleep } = useApp();
  const [weight, setWeight] = useState('');
  const [waterCups, setWaterCups] = useState(0);
  const [steps, setSteps] = useState('');
  const [sleepH, setSleepH] = useState('');
  const [sleepQ, setSleepQ] = useState(3);

  const addWater = () => {
    const current = dailyLog?.water_ml || 0;
    logWater(current + 250);
    setWaterCups(c => c + 1);
  };

  const handleSleep = () => {
    const h = parseFloat(sleepH);
    if (h > 0 && h < 24) { logSleep(h, sleepQ); setSleepH(''); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Trackers</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weight */}
        <Card title="Weight">
          <View style={styles.bigRow}>
            <Text style={styles.bigValue}>{dailyLog?.weight ? `${dailyLog.weight} kg` : '—'}</Text>
            <View style={styles.inputGroup}>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="kg" placeholderTextColor="#ccc" />
              <TouchableOpacity style={styles.btn} onPress={() => { const w = parseFloat(weight); if (w > 0) { logWeight(w); setWeight(''); } }}>
                <Text style={styles.btnText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Water */}
        <Card title={`Water • ${dailyLog?.water_ml ? `${(dailyLog.water_ml / 1000).toFixed(1)}L` : '0L'}`}>
          <View style={styles.waterRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
              const filled = (dailyLog?.water_ml || 0) >= i * 250;
              return (
                <TouchableOpacity key={i} style={[styles.waterDot, filled && styles.waterFilled]} onPress={addWater}>
                  <Text style={styles.waterIcon}>{filled ? '💧' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addWater}>
            <Text style={styles.addBtnText}>+ 250ml</Text>
          </TouchableOpacity>
        </Card>

        {/* Steps */}
        <Card title="Steps">
          <View style={styles.bigRow}>
            <Text style={styles.bigValue}>{dailyLog?.steps?.toLocaleString() || '0'}</Text>
            <View style={styles.inputGroup}>
              <TextInput style={styles.input} value={steps} onChangeText={setSteps} keyboardType="numeric" placeholder="steps" placeholderTextColor="#ccc" />
              <TouchableOpacity style={styles.btn} onPress={() => { const s = parseInt(steps); if (s > 0) { logSteps(s); setSteps(''); } }}>
                <Text style={styles.btnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Sleep */}
        <Card title="Sleep">
          <View style={styles.bigRow}>
            <Text style={styles.bigValue}>{dailyLog?.sleep_hours ? `${dailyLog.sleep_hours}h` : '—'}</Text>
            <View style={styles.inputGroup}>
              <TextInput style={[styles.input, { width: 60 }]} value={sleepH} onChangeText={setSleepH} keyboardType="numeric" placeholder="hrs" placeholderTextColor="#ccc" />
              <View style={styles.sleepQRow}>
                {[1, 2, 3, 4, 5].map(q => (
                  <TouchableOpacity key={q} style={[styles.sqBtn, sleepQ === q && styles.sqActive]} onPress={() => setSleepQ(q)}>
                    <Text style={styles.sqText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleSleep}><Text style={styles.btnText}>Log</Text></TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Prayer */}
        <Card title={`Prayer • ${prayers.filter(p => p.on_time).length}/5`}>
          <View style={styles.prayerGrid}>
            {PRAYER_NAMES.map(name => {
              const p = prayers.find(pr => pr.prayer_name === name);
              const done = p?.on_time === 1;
              const qada = p?.qada === 1;
              return (
                <TouchableOpacity key={name} style={[styles.prayerBtn, done && styles.prayerDone, qada && !done && styles.prayerQada]} onPress={() => togglePrayer(name)}>
                  <Text style={styles.prayerName}>{name}</Text>
                  <Text style={styles.prayerIcon}>{done ? '✅' : qada ? '⏳' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Mood */}
        <Card title="Mood">
          <View style={styles.moodRow}>
            {[1, 2, 3, 4, 5].map(m => (
              <TouchableOpacity key={m} style={[styles.moodBtn, dailyLog?.mood === m && styles.moodActive]} onPress={() => logMood(m)}>
                <Text style={styles.moodEmoji}>{['😢', '😟', '😐', '🙂', '😊'][m - 1]}</Text>
                <Text style={[styles.moodLabel, dailyLog?.mood === m && styles.moodActiveLabel]}>{['Awful', 'Bad', 'Meh', 'Good', 'Great'][m - 1]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 18, color: '#9b9a97' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#37352f', marginLeft: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigValue: { fontSize: 28, fontWeight: '700', color: '#37352f', minWidth: 80 },
  inputGroup: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    height: 36, borderWidth: 1, borderColor: '#efefef', borderRadius: 8,
    paddingHorizontal: 12, fontSize: 14, color: '#37352f', backgroundColor: '#fafafa', flex: 1,
  },
  btn: {
    backgroundColor: '#0b6bcf', paddingHorizontal: 16, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  waterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  waterDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f7f6f3',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#efefef',
  },
  waterFilled: { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' },
  waterIcon: { fontSize: 16 },
  addBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#e0f2fe', borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#0369a1' },
  sleepQRow: { flexDirection: 'row', gap: 4 },
  sqBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f7f6f3', alignItems: 'center', justifyContent: 'center' },
  sqActive: { backgroundColor: '#0b6bcf' },
  sqText: { fontSize: 12, fontWeight: '600', color: '#37352f' },
  prayerGrid: { flexDirection: 'row', gap: 8 },
  prayerBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef',
  },
  prayerDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  prayerQada: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  prayerName: { fontSize: 11, fontWeight: '600', color: '#37352f', marginBottom: 6 },
  prayerIcon: { fontSize: 18 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f7f6f3', borderWidth: 1, borderColor: '#efefef',
  },
  moodActive: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 10, color: '#9b9a97', fontWeight: '500' },
  moodActiveLabel: { color: '#6366f1', fontWeight: '600' },
});

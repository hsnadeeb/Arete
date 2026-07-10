import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Icon } from '../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../constants/typography';
import * as db from '../db/service';
import { PROVIDERS, askAi } from '../services/ai';

type ProviderConfig = {
  provider: string;
  model: string;
  api_key: string;
  is_active: number;
};

export default function AISettingsScreen() {
  const { theme } = useTheme();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const colors = theme.colors;

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testQuestion, setTestQuestion] = useState('');
  const [testAnswer, setTestAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const rows = await db.getAiProviders();
    setProviders(rows);
    const active = rows.find((p: any) => p.is_active);
    if (active) {
      setSelectedProvider(active.provider);
      setModel(active.model);
      setApiKey(active.api_key);
    }
    setLoading(false);
  };

  const handleSelectProvider = (id: string) => {
    setSelectedProvider(id);
    const existing = providers.find((p) => p.provider === id);
    if (existing) {
      setModel(existing.model);
      setApiKey(existing.api_key);
    } else {
      const def = PROVIDERS.find((p) => p.id === id);
      setModel(def?.models[0] || 'gpt-4o');
      setApiKey('');
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key.');
      return;
    }
    setSaving(true);
    try {
      await db.upsertAiProvider({
        provider: selectedProvider,
        model,
        api_key: apiKey.trim(),
        is_active: 1,
      });
      await db.setActiveAiProvider(selectedProvider);
      await loadProviders();
      Alert.alert('Saved', `${selectedProvider} configured and set as active.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testQuestion.trim()) {
      Alert.alert('Error', 'Enter a question to test with.');
      return;
    }
    setTesting(true);
    setTestAnswer('');
    try {
      const answer = await askAi(testQuestion);
      setTestAnswer(answer);
    } catch (e: any) {
      setTestAnswer(`Error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const activeProvider = providers.find((p) => p.is_active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
          <Icon name={LUCIDE_ICONS.menu} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        {activeProvider && (
          <Card title="Active Provider" style={{ backgroundColor: colors.surface, borderLeftColor: colors.success, borderLeftWidth: 3 }}>
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {PROVIDERS.find((p) => p.id === activeProvider.provider)?.label || activeProvider.provider}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Model: {activeProvider.model}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.successBg }]}>
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600' }}>ACTIVE</Text>
              </View>
            </View>
          </Card>
        )}

        <Card title="Provider" style={{ backgroundColor: colors.surface }}>
          <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
            {PROVIDERS.map((p) => {
              const isSelected = selectedProvider === p.id;
              const configured = providers.find((cp) => cp.provider === p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.accentBg, borderColor: colors.accent },
                  ]}
                  onPress={() => handleSelectProvider(p.id)}
                >
                  <Text style={[
                    { color: colors.text, fontSize: 13, fontWeight: '500' },
                    isSelected && { color: colors.accent },
                  ]}>
                    {p.label}
                  </Text>
                  {configured && (
                    <Icon name={LUCIDE_ICONS.checkCircle} size={12} color={colors.success} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {(() => {
          const config = PROVIDERS.find((p) => p.id === selectedProvider);
          if (!config) return null;
          return (
            <Card title={`${config.label} Configuration`} style={{ backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 8 }}>Model</Text>
              <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
                {config.models.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                      model === m && { backgroundColor: colors.accentBg, borderColor: colors.accent },
                    ]}
                    onPress={() => setModel(m)}
                  >
                    <Text style={[
                      { color: colors.text, fontSize: 12 },
                      model === m && { color: colors.accent, fontWeight: '600' },
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12, marginBottom: 8 }}>API Key</Text>
              <TextInput
                style={[styles.inp, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                placeholder={`Enter your ${config.label} API key`}
                placeholderTextColor={colors.placeholder}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save & Activate</Text>
                )}
              </TouchableOpacity>
            </Card>
          );
        })()}

        <Card title="Test AI" style={{ backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 8 }}>
            Ask a question using your data context:
          </Text>
          <TextInput
            style={[styles.inp, styles.textarea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. What should I improve this week?"
            placeholderTextColor={colors.placeholder}
            value={testQuestion}
            onChangeText={setTestQuestion}
            multiline
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.info }, (testing || !testQuestion.trim()) && { opacity: 0.5 }]}
            onPress={handleTest}
            disabled={testing || !testQuestion.trim()}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Ask AI</Text>
            )}
          </TouchableOpacity>
          {testAnswer ? (
            <View style={[styles.answerBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{testAnswer}</Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderBottomWidth: 1 },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginLeft: 4 },
  row: { flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  inp: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  answerBox: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
});

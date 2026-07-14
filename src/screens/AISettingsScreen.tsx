import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Icon } from "../components/Icons";
import { LUCIDE_ICONS, TYPOGRAPHY } from "../constants/typography";
import * as db from "../db/service";
import { PROVIDERS, askAi, verifyProvider } from "../services/ai";

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
  const [selectedProvider, setSelectedProvider] = useState<string>(
    PROVIDERS[0].id,
  );
  const [model, setModel] = useState(PROVIDERS[0].models[0].id);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testAnswer, setTestAnswer] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
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
      setModel(def?.models[0]?.id || "");
      setApiKey("");
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter an API key.");
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
      Alert.alert("Saved", `${selectedProvider} configured and set as active.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testQuestion.trim()) {
      Alert.alert("Error", "Enter a question to test with.");
      return;
    }
    setTesting(true);
    setTestAnswer("");
    try {
      const answer = await askAi(testQuestion);
      setTestAnswer(answer);
    } catch (e: any) {
      setTestAnswer(`Error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter an API key first.");
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyProvider(selectedProvider, model, apiKey.trim());
      setVerifyResult(result);
      if (result.ok) {
        Alert.alert("API Key Works", result.message);
      } else {
        Alert.alert("API Key Check Failed", result.message);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setVerifying(false);
    }
  };

  const activeProvider = providers.find((p) => p.is_active);
  const selectedConfig = PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.menuBtn}
        >
          <Icon name={LUCIDE_ICONS.menu} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}
      >
        {activeProvider && (
          <Card
            title="Active Provider"
            style={{
              backgroundColor: colors.surface,
            }}
          >
            <View
              style={[
                styles.row,
                { justifyContent: "space-between", alignItems: "center" },
              ]}
            >
              <View>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {PROVIDERS.find((p) => p.id === activeProvider.provider)
                    ?.label || activeProvider.provider}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                  Model: {activeProvider.model}
                </Text>
              </View>
              <View
                style={[styles.badge, { backgroundColor: colors.successBg }]}
              >
                <Text
                  style={{
                    color: colors.success,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  ACTIVE
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card title="Provider" style={{ backgroundColor: colors.surface }}>
          <View style={[styles.row, { gap: 6, flexWrap: "wrap" }]}>
            {PROVIDERS.map((p) => {
              const isSelected = selectedProvider === p.id;
              const configured = providers.find((cp) => cp.provider === p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                    },
                    isSelected && {
                      backgroundColor: colors.accentBg,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => handleSelectProvider(p.id)}
                >
                  <Text
                    style={[
                      { color: colors.text, fontSize: 13, fontWeight: "500" },
                      isSelected && { color: colors.accent },
                    ]}
                  >
                    {p.label}
                  </Text>
                  {p.freeTier && (
                    <View
                      style={[
                        styles.freeBadge,
                        { backgroundColor: colors.successBg },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.success,
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        FREE
                      </Text>
                    </View>
                  )}
                  {configured && (
                    <Icon
                      name={LUCIDE_ICONS.checkCircle}
                      size={12}
                      color={colors.success}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {selectedConfig && (
          <Card
            title={`${selectedConfig.label} Configuration`}
            style={{ backgroundColor: colors.surface }}
          >
            {/* Free-tier explainer + link to grab a key, so people know what they're signing up for */}
            <View
              style={[
                styles.noteBox,
                {
                  backgroundColor: selectedConfig.freeTier
                    ? colors.successBg
                    : colors.bgSecondary,
                  borderColor: selectedConfig.freeTier
                    ? colors.success
                    : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedConfig.freeTier
                    ? colors.success
                    : colors.textTertiary,
                  fontSize: 12,
                  lineHeight: 17,
                }}
              >
                {selectedConfig.freeTierNote}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(selectedConfig.getKeyUrl)}
                style={{ marginTop: 6 }}
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {selectedConfig.freeTier
                    ? "Get a free API key →"
                    : "Get an API key →"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              Model
            </Text>
            <View style={[styles.row, { gap: 6, flexWrap: "wrap" }]}>
              {selectedConfig.models.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                    },
                    model === m.id && {
                      backgroundColor: colors.accentBg,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={() => setModel(m.id)}
                >
                  <Text
                    style={[
                      { color: colors.text, fontSize: 12 },
                      model === m.id && {
                        color: colors.accent,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                  {m.free && (
                    <View
                      style={[
                        styles.freeBadge,
                        { backgroundColor: colors.successBg },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.success,
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        FREE
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 12,
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              API Key
            </Text>
            <TextInput
              style={[
                styles.inp,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={`Enter your ${selectedConfig.label} API key`}
              placeholderTextColor={colors.placeholder}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.info },
                verifying && { opacity: 0.5 },
              ]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Verify API Key
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.accent },
                saving && { opacity: 0.5 },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Save & Activate
                </Text>
              )}
            </TouchableOpacity>

            {verifyResult && (
              <View
                style={[
                  styles.answerBox,
                  {
                    backgroundColor: verifyResult.ok
                      ? colors.successBg
                      : colors.bgSecondary,
                    borderColor: verifyResult.ok
                      ? colors.success
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: verifyResult.ok ? colors.success : colors.error,
                    fontSize: 13,
                  }}
                >
                  {verifyResult.ok ? "✓ " : "✗ "} {verifyResult.message}
                </Text>
              </View>
            )}
          </Card>
        )}

        <Card title="Test AI" style={{ backgroundColor: colors.surface }}>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Ask a question using your data context:
          </Text>
          <TextInput
            style={[
              styles.inp,
              styles.textarea,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. What should I improve this week?"
            placeholderTextColor={colors.placeholder}
            value={testQuestion}
            onChangeText={setTestQuestion}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.info },
              (testing || !testQuestion.trim()) && { opacity: 0.5 },
            ]}
            onPress={handleTest}
            disabled={testing || !testQuestion.trim()}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600" }}>Ask AI</Text>
            )}
          </TouchableOpacity>
          {testAnswer ? (
            <View
              style={[
                styles.answerBox,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}
              >
                {testAnswer}
              </Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "600", marginLeft: 4 },
  row: { flexDirection: "row" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  freeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  noteBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  saveBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  answerBox: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
});

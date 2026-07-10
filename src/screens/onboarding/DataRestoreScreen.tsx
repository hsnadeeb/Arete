import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icons';
import { LUCIDE_ICONS, TYPOGRAPHY } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import * as SQLite from 'expo-sqlite';

interface DataRestoreScreenProps {
  visible: boolean;
  hasOldData: boolean;
  onStartFresh: () => void;
  onKeepData: () => void;
}

export default function DataRestoreScreen({ visible, hasOldData, onStartFresh, onKeepData }: DataRestoreScreenProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <SafeAreaView style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
          <View style={[styles.iconContainer, { backgroundColor: tc.accentBg }]}>
            <Icon name={LUCIDE_ICONS.database} size={48} color={tc.accent} />
          </View>

          <Text style={[styles.title, { color: tc.text }]}>Existing Data Found</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            We found data from a previous installation. Would you like to start fresh or keep your existing data?
          </Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: tc.surface, borderColor: tc.border }]}
              onPress={onStartFresh}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#fee2e2' }]}>
                <Icon name={LUCIDE_ICONS.trash2} size={24} color="#ef4444" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: tc.text }]}>Start Fresh</Text>
                <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>
                  Clear all existing data and begin with a clean slate
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: tc.surface, borderColor: tc.border }]}
              onPress={onKeepData}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#d1fae5' }]}>
                <Icon name={LUCIDE_ICONS.checkCircle} size={24} color="#10b981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: tc.text }]}>Keep Existing Data</Text>
                <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>
                  Preserve your current data and continue where you left off
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.laterButton, { borderColor: tc.border }]}
            onPress={onKeepData}
          >
            <Text style={[styles.laterButtonText, { color: tc.textSecondary }]}>
              Decide Later (Keep Data)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  options: {
    width: '100%',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: 4,
  },
  optionDescription: {
    ...TYPOGRAPHY.body,
  },
  laterButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

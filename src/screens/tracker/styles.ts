import { StyleSheet } from "react-native";
import { TYPOGRAPHY } from "../../constants/typography";

export const trackerStyles = StyleSheet.create({
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  hamburger: { width: 32 },
  headerTitle: { ...TYPOGRAPHY.body, fontWeight: "600", marginLeft: 8 },

  // ── Tab bar ──
  tabBar: {
    maxHeight: 52,
    borderBottomWidth: 1,
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: "500" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },

  // ── Shared ──
  tabContent: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    marginBottom: 4,
  },
  bigVal: {
    ...TYPOGRAPHY.monoLg,
  },
  bigValRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  trendLabel: {
    ...TYPOGRAPHY.captionSm,
    marginBottom: 8,
    fontWeight: "600",
  },

  // ── Stat cards ──
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statData: {
    flex: 1,
    marginLeft: 12,
  },
  statLabel: { ...TYPOGRAPHY.statLabel },
  statVal: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 1,
  },
  miniSparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 28,
  },
  sparkBar: {
    width: 4,
    borderRadius: 2,
  },

  // ── Action row (input + button) ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  logBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Water cups ──
  waterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginVertical: 8,
  },
  waterCup: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  waterCupLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Steps dots ──
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 12,
  },
  stepDot: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },

  // ── Mood ──
  moodRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginVertical: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  moodLabel: {
    ...TYPOGRAPHY.captionSm,
    marginTop: 4,
    fontWeight: "500",
  },

  // ── Habits ──
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  habitName: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  habitStreak: {
    ...TYPOGRAPHY.captionSm,
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  // ── FAB ──
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // ── Filter chips ──
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...TYPOGRAPHY.input,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  // ── Back button ──
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
  },

  // ── Emoji grid ──
  emojiGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 6,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },

  // ── Color picker ──
  colorGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },

  // ── Label ──
  label: {
    ...TYPOGRAPHY.btnSm,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
});

# Typography & Icon Refactor Plan

**Goal:** Make `src/constants/typography.ts` the single source of truth for all text styling and icon naming, replace `@expo/vector-icons` (Feather) with `lucide-react-native`, and eliminate inline emoji usage across the app.

**Architecture:**
- `src/constants/typography.ts` exports typed text-style presets (heading, body, caption, label, button, etc.) plus a `LUCIDE_ICONS` mapping from semantic names to Lucide icon names.
- `src/components/Icons.tsx` becomes a thin wrapper around `lucide-react-native` that consumes the typography mapping and supports dynamic color/size.
- All screens/components consume `TYPOGRAPHY` for `Text` styles and `<Icon />` / mapped icons instead of hardcoded emoji or `@expo/vector-icons`.

**Tech Stack:** React Native, Expo SDK 54, TypeScript, lucide-react-native, zustand.

---

## Chunk 1: Foundation — typography.ts + Icons.tsx

**Files:**
- Modify: `src/constants/typography.ts`
- Modify: `src/components/Icons.tsx`

**Complexity:** simple

**Work:**
1. Expand `TYPOGRAPHY` to cover all current inline text styles used in screens: `h1..h4`, `body`, `bodySm`, `caption`, `captionSm`, `label`, `meta`, `metaBold`, `mono`, `monoLg`, `accent`, `accentSm`, `btn`, `btnSm`, `title` (card titles), `statValue`, `statLabel`, `emptyTitle`, `emptySubtitle`.
2. Remove emoji/unicode symbol tables (`ICONS`, `EMOJI_TO_ICON`, `ICON_LABELS`). Replace with `LUCIDE_ICONS: Record<string, LucideIconName>` mapping semantic names (e.g. `menu`, `arrowUp`, `arrowDown`, `close`, `check`, `edit`, `sun`, `moon`, `cloud`, `droplet`, `activity`, `weight`, `trendingUp`, `barChart`, `fileText`, `calendar`, `grid`, `smile`, `frown`, `meh`, `plus`, `refreshCw`, `dollarSign`, `shoppingBag`, `book`, `film`, `pill`, `coffee`, `briefcase`, `home`, `school`, `bank`, `rocket`, `award`, `target`, `zap`, `star`, `bell`, `clock`, `compass`, `x`, `chevronRight`, `chevronUp`, `chevronDown`, `settings`, `user`, `sliders`, `layout`, `trash2`, `search`) to actual lucide icon names.
3. Update `src/components/Icons.tsx`: replace `Feather` import with `lucide-react-native`, type `IconProps.name` as `LucideIconName`, use the `Lucide` icon component dynamically.
4. Add convenience `getIcon(name: string): LucideIconName` helper that falls back to `'circle'`.

**Acceptance criteria:**
- `tsc --noEmit` passes for `typography.ts` and `Icons.tsx`.
- No `@expo/vector-icons` imports remain in `Icons.tsx`.
- All icon names used in the app are defined in `LUCIDE_ICONS`.

---

## Chunk 2: Shared Components — Card.tsx + BottomNavBar.tsx

**Files:**
- Modify: `src/components/Card.tsx`
- Modify: `src/components/BottomNavBar.tsx`

**Complexity:** simple

**Work:**
1. `Card.tsx`: replace static `fontSize`/`fontWeight`/`color` with `TYPOGRAPHY.title` etc.; accept theme colors so colors remain dynamic.
2. `BottomNavBar.tsx`: replace `Feather` import with `Icon` from `src/components/Icons`; use `LUCIDE_ICONS` names for tab icons; replace tab-label `Text` style with `TYPOGRAPHY.label`.

**Acceptance criteria:**
- No `@expo/vector-icons` imports remain in these files.
- Card title uses `TYPOGRAPHY.title`.
- Bottom nav uses lucide icons and typography label style.

---

## Chunk 3: DashboardScreen Migration

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`

**Complexity:** simple

**Work:**
1. Replace all inline emoji strings (☰, 🔄, 🔥, ✎, ✓, ⬆️⬇️, 🔮, 🤲, ➕, 🍎, 🚇, 🛍️, 📄, 💊, 📚, 🎬, 💰, 📌, ⚖️, 💧, 🚶, 😢, 😟, 😑, 🙂, 😊) with `<Icon />` using `LUCIDE_ICONS`.
2. Replace all inline `fontSize`/`fontWeight` styles in `s` and inline `Text` styles with `TYPOGRAPHY.*` presets.
3. Keep dynamic color props (`{ color: tc.heading }`) applied on top of typography presets.
4. Replace `CATEGORY_EMOJIS` with `CATEGORY_ICONS: Record<string, LucideIconName>` from `LUCIDE_ICONS`.
5. Replace `PRAYER_EMOJIS` usage with `PRAYER_ICONS` already present in `types.ts` (Feather names map to lucide equivalents).

**Acceptance criteria:**
- No inline emoji characters remain in the file.
- All `Text` styles derive from `TYPOGRAPHY`.
- TypeScript compiles.

---

## Chunk 4: TrackerScreen Migration

**Files:**
- Modify: `src/screens/TrackerScreen.tsx`

**Complexity:** simple

**Work:**
1. Replace inline emoji in `TABS` array (📊, ⚖️, 💧, 🚶, 🌙, 😊, ✅) with lucide icon names and render with `<Icon />`.
2. Replace hardcoded Text styles with `TYPOGRAPHY`.
3. Replace habit emoji picker emoji characters with `lucide-react-native` icon names. Keep the `Habit.emoji` DB field for backward compatibility but render icons from a curated `HABIT_ICONS` list.
4. Replace inline arrows/unicode (▸, ▾, ✓, ›, +) with lucide icons.

**Acceptance criteria:**
- No inline emoji characters remain.
- Habit picker shows lucide icons instead of emoji.
- TypeScript compiles.

---

## Chunk 5: Remaining Screens & Navigation

**Files:**
- Modify: `src/navigation/DrawerNavigator.tsx`
- Modify: `src/screens/ProfileScreen.tsx`
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/FocusScreen.tsx`
- Modify: `src/screens/JournalScreen.tsx`
- Modify: `src/screens/AISettingsScreen.tsx`
- Modify: `src/screens/BudgetScreen.tsx`
- Modify: `src/screens/PlannerScreen.tsx`
- Modify: `src/screens/GreetingScreen.tsx`
- Modify: `src/screens/WidgetEditor.tsx`
- Modify: `src/screens/onboarding/WelcomeScreen.tsx`
- Modify: `src/screens/onboarding/GoalsScreen.tsx`
- Modify: `src/screens/onboarding/PreferencesScreen.tsx`
- Modify: `src/screens/onboarding/DataRestoreScreen.tsx`
- Modify: `src/components/Charts.tsx` (icon usage)

**Complexity:** simple

**Work:**
1. In each file: remove `@expo/vector-icons` import; import `Icon` from `../components/Icons` and `TYPOGRAPHY`, `LUCIDE_ICONS` from `../constants/typography`.
2. Replace `Feather` usages with `<Icon name={...} ... />`.
3. Replace inline emoji/unicode (menu, arrows, check, close, etc.) with lucide icons.
4. Replace inline `fontSize`/`fontWeight`/`lineHeight`/`letterSpacing` text styles with `TYPOGRAPHY` presets.

**Acceptance criteria:**
- No `@expo/vector-icons` imports remain in `src/`.
- No inline emoji characters remain in these files.
- TypeScript compiles for each modified file.

---

## Chunk 6: Type & API Cleanup

**Files:**
- Modify: `src/types.ts`
- Modify: `src/services/ai.ts`

**Complexity:** simple

**Work:**
1. `src/types.ts`: update `FeatherIconName` references to `LucideIconName` (imported from lucide-react-native); update `PRAYER_ICONS` and `WIDGET_DEFINITIONS` icon values to lucide names.
2. `src/services/ai.ts`: replace emoji in habit strings with icon references or remove emoji prefix (keep text only).

**Acceptance criteria:**
- `types.ts` uses `LucideIconName`.
- No emoji literals in `ai.ts` prompt strings.

---

## Chunk 7: Verification

**Files:** project-wide

**Complexity:** simple

**Work:**
1. Run `npx tsc --noEmit` and fix any type errors.
2. Grep for remaining `@expo/vector-icons` imports and inline emoji; report any stragglers.
3. Run `npx expo start --web` smoke test (if feasible within time) or at least confirm metro bundle resolves lucide icons.

**Acceptance criteria:**
- `tsc --noEmit` passes.
- No `@expo/vector-icons` imports in `src/`.
- Inline emoji reduced to a documented minimum (habit DB `emoji` field retained for data but rendered via icons).

---

# Execution Notes

- Preserve all existing behavior, navigation, and data layer.
- Colors remain dynamic from `theme.colors`; typography presets only provide size/weight/spacing.
- For habit emoji storage, the DB column stays `emoji`; display uses a mapping from habit name or a fixed icon list.
- If a lucide icon name is missing, add it to `LUCIDE_ICONS` in `typography.ts` rather than hardcoding.

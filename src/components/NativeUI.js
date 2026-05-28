import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const colors = {
  bg: "#0f0f1a",
  card: "#1a1a2e",
  card2: "#16213e",
  sidebar: "#0d0d1f",
  border: "#2a2a4a",
  borderLight: "#3a3a5a",
  text: "#f0f0ff",
  muted: "#a0a0c0",
  primary: "#6c63ff",
  primaryDark: "#5548e0",
  primaryLight: "#8b85ff",
  secondary: "#0abde3",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
};

export function Screen({ title, subtitle, children, scroll = true }) {
  const content = (
    <View style={styles.content}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );

  return scroll ? (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {content}
    </ScrollView>
  ) : (
    <View style={styles.screen}>{content}</View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatCard({ label, value, tone = "primary" }) {
  return (
    <View style={[styles.statCard, styles[`${tone}Stat`]]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Button({ children, onPress, variant = "primary", disabled, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, styles[`${variant}Button`], disabled && styles.disabled, style]}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
}

export function IconButton({ label, onPress, variant = "secondary", disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconButton, styles[`${variant}Button`], disabled && styles.disabled]}
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline }) {
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6060a0"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

const pad = (value) => String(value).padStart(2, "0");
const formatDateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

let NativeDateTimePicker = null;
let nativeDateTimePickerChecked = false;

const getNativeDateTimePicker = () => {
  if (Platform.OS === "web") return null;
  if (nativeDateTimePickerChecked) return NativeDateTimePicker;

  nativeDateTimePickerChecked = true;
  try {
    NativeDateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (error) {
    NativeDateTimePicker = null;
  }
  return NativeDateTimePicker;
};

export function DateInput({ label, value, onChange, placeholder = "Select date" }) {
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const selectedDate = React.useMemo(() => {
    if (!value) return today;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? today : parsed;
  }, [today, value]);
  const options = React.useMemo(() => {
    const days = [];
    for (let offset = -14; offset <= 45; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      days.push({
        label: formatDateValue(date),
        value: formatDateValue(date),
      });
    }
    return days;
  }, [today]);

  const handleNativeChange = (event, date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event?.type === "dismissed") return;
    if (date) onChange(formatDateValue(date));
  };

  const DateTimePicker = open ? getNativeDateTimePicker() : null;
  const showNativePicker = open && DateTimePicker;
  const showFallbackPicker = open && !DateTimePicker;

  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.selectChevron}>calendar</Text>
      </Pressable>
      {showNativePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleNativeChange}
        />
      )}
      <Modal transparent visible={showFallbackPicker} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalShade} onPress={() => setOpen(false)}>
          <View style={styles.selectMenu}>
            <Text style={styles.strong}>{label || "Select date"}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.selectOption, item.value === value && styles.selectOptionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.text, item.value === value && styles.selectOptionTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Select({ label, value, placeholder = "Select option", options = [], onChange }) {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = options.find((item) => item.value === value)?.label || value;

  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !selectedLabel && styles.selectPlaceholder]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.selectChevron}>v</Text>
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalShade} onPress={() => setOpen(false)}>
          <View style={styles.selectMenu}>
            <Text style={styles.strong}>{label || placeholder}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.selectOption, item.value === value && styles.selectOptionActive]}
                  onPress={() => {
                    onChange(item.value, item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.text, item.value === value && styles.selectOptionTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ConfirmDialog({ visible, title, message, confirmLabel = "Confirm", danger, onCancel, onConfirm }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalShade}>
        <View style={styles.confirmBox}>
          <Text style={styles.titleSmall}>{title}</Text>
          {message ? <Text style={styles.muted}>{message}</Text> : null}
          <View style={styles.row}>
            <Button variant="secondary" onPress={onCancel}>Cancel</Button>
            <Button variant={danger ? "danger" : "primary"} onPress={onConfirm}>{confirmLabel}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Badge({ children, tone = "primary" }) {
  return (
    <View style={[styles.badge, styles[`${tone}Badge`]]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

export function Loading({ label = "Loading..." }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function Empty({ title, body }) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={styles.muted}>{body}</Text>}
    </Card>
  );
}

export function DataList({ data, keyExtractor, renderItem, emptyTitle }) {
  if (!data.length) return <Empty title={emptyTitle || "No records found"} />;
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 32 },
  content: { padding: 20, gap: 18, width: "100%", maxWidth: 1180, alignSelf: "center" },
  header: { gap: 4, marginBottom: 4 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  statCard: {
    minWidth: 150,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    borderTopWidth: 4,
  },
  primaryStat: { borderTopColor: colors.primary },
  successStat: { borderTopColor: colors.success },
  warningStat: { borderTopColor: colors.warning },
  dangerStat: { borderTopColor: colors.danger },
  secondaryStat: { borderTopColor: colors.secondary },
  statValue: { color: colors.text, fontSize: 28, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  button: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.borderLight },
  dangerButton: { backgroundColor: colors.danger },
  successButton: { backgroundColor: colors.success },
  disabled: { opacity: 0.55 },
  buttonText: { color: "#fff", fontWeight: "700" },
  inputWrap: { gap: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: colors.text,
    paddingHorizontal: 12,
  },
  selectButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectText: { color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.muted },
  selectChevron: { color: colors.primaryLight, fontWeight: "900" },
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  selectMenu: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.card2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  confirmBox: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.card2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  titleSmall: { color: colors.text, fontSize: 18, fontWeight: "900" },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(42,42,74,0.45)",
  },
  selectOptionActive: { backgroundColor: "rgba(108,99,255,0.25)" },
  selectOptionTextActive: { color: colors.primaryLight, fontWeight: "800" },
  textArea: { minHeight: 92, paddingTop: 10, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  split: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  text: { color: colors.text },
  strong: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.muted },
  navItem: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: "rgba(108,99,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.22)",
  },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  primaryBadge: { backgroundColor: "rgba(108,99,255,0.2)" },
  successBadge: { backgroundColor: "rgba(16,185,129,0.2)" },
  warningBadge: { backgroundColor: "rgba(245,158,11,0.2)" },
  dangerBadge: { backgroundColor: "rgba(239,68,68,0.2)" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  loading: { alignItems: "center", justifyContent: "center", gap: 10, padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  separator: { height: 10 },
});

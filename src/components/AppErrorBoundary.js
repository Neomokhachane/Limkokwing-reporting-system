import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./NativeUI";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app could not render this screen. Please try again.
          </Text>
          <Text style={styles.detail} numberOfLines={3}>
            {this.state.error?.message || "Unexpected application error"}
          </Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 20,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
  body: { color: colors.muted, lineHeight: 21 },
  detail: { color: colors.warning, fontSize: 12 },
  button: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: { color: "#fff", fontWeight: "800" },
});

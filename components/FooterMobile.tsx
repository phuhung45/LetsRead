// components/FooterMobile.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function FooterMobile({ showUsername = false, username = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  const Button = ({
    route,
    icon,
    label,
  }: {
    route: string;
    icon: string;
    label: string;
  }) => {
    const isActive =
      (route === "/" && pathname === "/") ||
      (route !== "/" && pathname.startsWith(route));

    return (
      <TouchableOpacity
        style={styles.buttonWrap}
        onPress={() => router.push(route as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
          <Ionicons
            name={icon as any}
            size={22}
            style={[styles.icon, isActive && styles.activeIcon]}
          />
        </View>
        <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Button
          route="/"
          icon={Platform.OS === "ios" ? "home-outline" : "home-outline"}
          label="Home"
        />
        <Button
          route="/books"
          icon={Platform.OS === "ios" ? "book-outline" : "book-outline"}
          label="My Books"
        />
        <Button
          route="/profile"
          icon={Platform.OS === "ios" ? "person-outline" : "person-outline"}
          label="Profile"
        />
      </View>
      {showUsername && (
        <View style={styles.usernameRow}>
          <Text style={styles.usernameText}>{username}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  container: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonWrap: {
    flex: 1,
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: "#10B981",
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  icon: {
    color: "#8b8b8b",
  },
  activeIcon: {
    color: "white",
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: "#8b8b8b",
  },
  activeLabel: {
    color: "#0f172a",
    fontWeight: "600",
  },
  usernameRow: {
    position: "absolute",
    left: 18,
    top: -18,
    backgroundColor: "transparent",
  },
  usernameText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
});

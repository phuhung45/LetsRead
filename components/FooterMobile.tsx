import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  active?: "home" | "library" | "profile";
  onNavigate?: (route: "home" | "library" | "profile") => void;
  showUsername?: boolean;
  username?: string;
};

export default function FooterMobile({
  active = "home",
  onNavigate = () => {},
  showUsername = false,
  username = "",
}: Props) {
  const Button = ({
    route,
    icon,
  }: {
    route: "home" | "library" | "profile";
    icon: string;
  }) => {
    const isActive = active === route;
    return (
      <TouchableOpacity
        style={styles.buttonWrap}
        onPress={() => onNavigate(route)}
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
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Button route="home" icon={Platform.OS === "ios" ? "home-outline" : "home-outline"}/>
        <Button route="library" icon={Platform.OS === "ios" ? "book-outline" : "book-outline"}/>
        <Button route="profile" icon={Platform.OS === "ios" ? "person-outline" : "person-outline"}/>
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
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "space-between",
    // shadow
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
    backgroundColor: "#10B981", // green-ish
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

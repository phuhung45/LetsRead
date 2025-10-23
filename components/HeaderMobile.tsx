import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, Entypo } from "@expo/vector-icons";

export default function Header() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.left}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.title}>Let’s Read</Text>
          <Text style={styles.subtitle}>The Asia Foundation</Text>
        </View>
      </View>

      {/* Language Selector */}
      <TouchableOpacity style={styles.langBtn}>
        <Ionicons name="globe-outline" size={18} color="green" />
        <Text style={styles.langText}>English</Text>
        <Entypo name="chevron-down" size={16} color="green" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 10,
    color: "#6d2a82",
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langText: {
    fontSize: 13,
    color: "green",
  },
});

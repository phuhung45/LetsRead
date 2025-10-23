// components/Header.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <Image source={require("../assets/images/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Let's Read</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
});

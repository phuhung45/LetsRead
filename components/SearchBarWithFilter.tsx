import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBarWithFilter({
  value,
  onChangeText,
  onOpenFilter,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onOpenFilter: () => void;
}) {
  const { width } = useWindowDimensions();

  // ✅ Responsive width
  const containerWidth =
    width < 600 ? "100%" : width < 1024 ? "70%" : "40%";

  return (
    <View style={[styles.row, { width: containerWidth }]}>
      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#1B5E20"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Search books..."
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
      </View>

      {/* FILTER BUTTON */}
      <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilter}>
        <Ionicons name="options" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 12,
  },

  searchBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1B5E20",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },

  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

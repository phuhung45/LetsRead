import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FilterPopup({
  visible,
  onClose,
  categories = [],
  selectedCategories,
  setSelectedCategories,
  onClear,
  onApply,
}: any) {
  const toggle = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((x) => x !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* ✅ OVERLAY FULLSCREEN */}
      <View style={styles.overlay}>
        {/* backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* ✅ CENTER POPUP */}
        <View style={styles.popup}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 260 }}>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.item,
                  selectedCategories.includes(cat.id) && styles.itemSelected,
                ]}
                onPress={() => toggle(cat.id)}
              >
                <Text
                  style={[
                    styles.itemText,
                    selectedCategories.includes(cat.id) && {
                      color: "#fff",
                      fontWeight: "600",
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClear}>
              <Text style={styles.clearAll}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.showBtn} onPress={onApply}>
              <Text style={styles.showBtnText}>Show Books</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  popup: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    elevation: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginBottom: 10,
  },

  itemSelected: {
    backgroundColor: "#1B5E20",
    borderColor: "#1B5E20",
  },

  itemText: {
    fontSize: 16,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  clearAll: {
    color: "#1B5E20",
    fontSize: 16,
    fontWeight: "600",
  },

  showBtn: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  showBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

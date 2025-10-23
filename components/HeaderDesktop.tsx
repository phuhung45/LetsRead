import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HeaderDesktop() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.header}>
      {/* LEFT: Logo */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* CENTER: Navigation buttons */}
      <View style={styles.navCenter}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home-outline" size={20} color="green" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/books")}
        >
          <Ionicons name="book-outline" size={20} color="green" />
          <Text style={styles.navText}>Books</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-outline" size={20} color="green" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* RIGHT: Language box + Menu */}
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.languageBox}>
          <Ionicons name="globe-outline" size={18} color="green" />
          <Text style={styles.languageText}>English</Text>
          <Ionicons name="chevron-down" size={14} color="green" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={28} color="green" />
        </TouchableOpacity>
      </View>

      {/* POPUP MENU */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.popup}>
                <TouchableOpacity
                  onPress={() => setMenuVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color="gray" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupLogin}>
                  <Text style={styles.popupLoginText}>
                    Log in to save your progress and favorite books
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupItem}>
                  <Ionicons name="globe-outline" size={18} color="green" />
                  <Text style={styles.popupText}>App Language — English</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupItem}>
                  <Ionicons name="information-circle-outline" size={18} color="green" />
                  <Text style={styles.popupText}>About Let's Read</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupItem}>
                  <Ionicons name="people-outline" size={18} color="green" />
                  <Text style={styles.popupText}>Collaborators</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupItem}>
                  <Ionicons name="document-text-outline" size={18} color="green" />
                  <Text style={styles.popupText}>Terms & Conditions</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "5%",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    width: 120,
    height: 40,
  },
  navCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f1f5f1",
  },
  navText: {
    color: "green",
    fontWeight: "600",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  languageBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  languageText: {
    color: "green",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: "15%", // lệch lên phía trên như ảnh
  },
  popup: {
    backgroundColor: "#fff",
    width: "20%",
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  popupLogin: {
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    padding: 10,
    alignSelf: "stretch",
    marginBottom: 16,
  },
  popupLoginText: {
    textAlign: "center",
    color: "green",
    fontWeight: "600",
  },
  popupItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 10,
  },
  popupText: {
    fontSize: 15,
    color: "#333",
  },
});

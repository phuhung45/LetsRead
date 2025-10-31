import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function HeaderDesktop() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Lấy user hiện tại
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();

    // ✅ Lắng nghe thay đổi trạng thái đăng nhập
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ✅ Đăng xuất
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuVisible(false);
  };

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

      {/* CENTER: Navigation */}
      <View style={styles.navCenter}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push("/")}>
          <Ionicons name="home-outline" size={20} color="green" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (!user) {
              Alert.alert("Please log in first");
              router.push("/login");
              return;
            }
            router.push("/books");
          }}
        >
          <Ionicons name="book-outline" size={20} color="green" />
          <Text style={styles.navText}>Books</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            if (!user) {
              Alert.alert("Please log in first");
              router.push("/login");
              return;
            }
            router.push("/profile");
          }}
        >
          <Ionicons name="person-outline" size={20} color="green" />
          <Text style={styles.navText}>
            {user ? user.user_metadata.full_name || "Profile" : "Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RIGHT: Language + Menu */}
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.languageBox}>
          <Ionicons name="globe-outline" size={18} color="green" />
          <Text style={styles.languageText}>English</Text>
          <Ionicons name="chevron-down" size={14} color="green" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="menu-outline" size={28} color="green" />
          )}
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

                {/* Nếu chưa login */}
                {!user ? (
                  <TouchableOpacity
                    style={styles.popupLogin}
                    onPress={() => {
                      setMenuVisible(false);
                      router.push("/login");
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="green" />
                    ) : (
                      <Text style={styles.popupLoginText}>
                        Log in with Google to save progress
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.userRow}>
                      {user?.user_metadata?.avatar_url && (
                        <Image
                          source={{ uri: user.user_metadata.avatar_url }}
                          style={styles.avatarPopup}
                        />
                      )}
                      <Text style={styles.userName}>
                        {user.user_metadata.full_name || "Reader"} 👋
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.popupItem}
                      onPress={() => {
                        setMenuVisible(false);
                        router.push("/profile");
                      }}
                    >
                      <Ionicons name="settings-outline" size={18} color="green" />
                      <Text style={styles.popupText}>Profile Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.popupItem} onPress={handleLogout}>
                      <Ionicons name="log-out-outline" size={18} color="green" />
                      <Text style={styles.popupText}>Log out</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.divider} />

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
  logo: { width: 120, height: 40 },
  navCenter: { flexDirection: "row", alignItems: "center", gap: 24 },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f1f5f1",
  },
  navText: { color: "green", fontWeight: "600" },
  rightSection: { flexDirection: "row", alignItems: "center", gap: 14 },
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
  languageText: { color: "green", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: "15%",
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
  closeButton: { position: "absolute", right: 12, top: 12 },
  popupLogin: {
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    padding: 10,
    alignSelf: "stretch",
    marginBottom: 16,
  },
  popupLoginText: { textAlign: "center", color: "green", fontWeight: "600" },
  popupItem: { flexDirection: "row", alignItems: "center", marginVertical: 8, gap: 10 },
  popupText: { fontSize: 15, color: "#333" },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPopup: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  userName: { fontWeight: "600", color: "green" },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
});

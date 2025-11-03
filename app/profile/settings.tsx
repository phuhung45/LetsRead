import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

import HeaderDesktop from "../../components/HeaderDesktop";
import HeaderMobile from "../../components/HeaderMobile";
import FooterDesktop from "../../components/FooterDesktop";
import FooterMobile from "../../components/FooterMobile";

const avatarList = [
  "http://storage.googleapis.com/lets-read-asia/assets/images/adcfa051-9cfc-431c-8625-739ebc6eb316.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/2b571f5b-e352-46ef-950c-4942b9b021b9.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/fb7525fa-7423-4287-bf42-e356e8ccd682.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/c8db41cf-c960-4f8c-9c6d-5addf8f8e740.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/0ae7812f-fa15-4eb8-af83-fc0cb4d266f9.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/7b0793cd-9a5f-4035-8465-9197f1e6c891.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/0c33748d-eef8-4977-a370-88d6f33981f1.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/bc2e685d-3e54-4570-b144-03b3a090131d.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/0b02db12-b916-4e7a-90af-240fc7ad1a83.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/27eb7344-c6a1-487a-ae7b-9436f42ee666.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/e4507e83-16cb-424a-8a7e-3b73e2dd9073.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/51a1367d-d10b-451c-b033-dcdfad6d504d.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/6d340601-f9bf-4b3d-b8e7-6ad960531a45.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/f8db361a-eedd-4d24-93e9-2b53b228061b.png",
  "http://storage.googleapis.com/lets-read-asia/assets/images/5bc71f3e-73c4-4838-9ada-d31e7d181c03.png",
];

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(avatarList[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Load user info
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;

      if (u) {
        if (u.user_metadata?.display_name) {
          setUsername(u.user_metadata.display_name);
        }
        if (u.user_metadata?.avatar_url) {
          setAvatar(u.user_metadata.avatar_url);
        }
      }
    };
    loadUser();
  }, []);

  // ✅ Update user info
  const handleUpdate = async () => {
    setLoading(true);
    setMessage("");

    try {
      const avatarUrl = avatar;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          display_name: username,
        },
      });
      if (authError) throw authError;

      await supabase.rpc("update_user_info_self", {
        p_avatar: avatarUrl,
        p_username: username,
      });

      setMessage("✅ Cập nhật thành công!");
    } catch (err: any) {
      setMessage("❌ Lỗi: " + err.message);
    }

    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {isDesktop ? <HeaderDesktop /> : <HeaderMobile />}

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/profile")}>
          <Text style={styles.backText}>⬅ Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Chỉnh sửa thông tin</Text>

        <View style={styles.previewWrapper}>
          <Image source={{ uri: avatar }} style={styles.previewAvatar} />
        </View>

        <TextInput
          placeholder="Tên hiển thị"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <Text style={{ marginBottom: 6, fontWeight: "500" }}>Chọn avatar:</Text>

        <View
          style={[
            styles.avatarGrid,
            isDesktop
              ? {
                  paddingHorizontal: "15%",
                  justifyContent: "space-between",
                }
              : { justifyContent: "center" },
          ]}
        >
          {avatarList.map((img, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setAvatar(img)}
              style={[
                styles.avatarWrapper,
                avatar === img && styles.avatarSelected,
                isDesktop ? { width: "16%" } : { width: "30%" }, // ✅ web nhỏ hơn
              ]}
            >
              <Image source={{ uri: img }} style={styles.avatar} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Text>
        </TouchableOpacity>

        {message ? (
          <Text
            style={{
              marginTop: 10,
              color: message.startsWith("✅") ? "green" : "red",
            }}
          >
            {message}
          </Text>
        ) : null}
      </ScrollView>

      {isDesktop ? <FooterDesktop /> : <FooterMobile />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  backBtn: { marginBottom: 10 },
  backText: { fontSize: 16, color: "#007AFF" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },

  previewWrapper: {
    alignSelf: "center",
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  previewAvatar: { width: 110, height: 110, borderRadius: 55 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },

  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  avatarWrapper: {
    aspectRatio: 1,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarSelected: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  avatar: { width: "90%", height: "90%", borderRadius: 9999 },

  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
});

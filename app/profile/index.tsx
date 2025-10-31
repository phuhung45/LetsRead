import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

import Header from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    loadUser();
  }, []);

  const navigate = (route: "home" | "library" | "profile") => {
    if (route === "home") router.push("/");
    else router.push(`/${route}`);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );

  if (!user)
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16 }}>You are not logged in.</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ marginTop: 10, color: "green" }}>Login →</Text>
        </TouchableOpacity>
      </View>
    );

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header />

      <View style={styles.container}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />

        <Text style={styles.name}>
          {user.user_metadata?.display_name || user.email}
        </Text>
        <Text style={styles.email}>{user.email}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/profile/settings")}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <FooterMobile active="profile" onNavigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: {
    alignItems: "center",
    paddingTop: 30,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "green",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

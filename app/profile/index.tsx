import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

// ✅ Import Header & Footer
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterDesktop from "../../components/FooterDesktop";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      setUser(currentUser);

      if (currentUser) {
        const userId = currentUser.id;
        const today = new Date().toISOString().split("T")[0];

        const { data: todayLogs } = await supabase
          .from("reading_logs")
          .select("minutes_read")
          .eq("user_id", userId)
          .gte("date", today);

        const todayMinutes =
          todayLogs?.reduce((a, x) => a + x.minutes_read, 0) || 0;

        const { count: totalBooks } = await supabase
          .from("books_read")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        const { data: catData } = await supabase.rpc(
          "get_user_top_categories",
          { uid: userId }
        );

        setStats({
          todayMinutes,
          goal: 20,
          totalBooks: totalBooks || 0,
          topCategories: catData || [],
        });
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );

  if (!user)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>You are not logged in.</Text>
        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );

  const { todayMinutes, goal, totalBooks, topCategories } = stats || {};

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Render Header */}
      <HeaderDesktop />

      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />

        <Text style={styles.name}>
          {user.user_metadata?.display_name || user.email}
        </Text>
        <Text style={styles.subtitle}>{user.email}</Text>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.header}>Today's Reading</Text>
          <Text style={styles.statValue}>{todayMinutes} min</Text>
          <Text style={styles.subText}>Goal: {goal} min a day →</Text>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.header}>Total Books Read</Text>
            <Text style={styles.statValue}>{totalBooks}</Text>
          </View>

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={styles.header}>Your Top 3 Categories</Text>
            {topCategories?.length > 0 ? (
              topCategories.map((c: any, idx: number) => (
                <Text key={idx} style={styles.category}>
                  {idx + 1}. {c.name} ({c.count})
                </Text>
              ))
            ) : (
              <Text style={styles.subText}>No data yet</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { marginTop: 30 }]}
          onPress={() => router.push("/profile/settings")}
        >
          <Text style={styles.buttonText}>Account Settings ⚙️</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Render Footer */}
      <FooterDesktop />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", backgroundColor: "#fff", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginTop: 40 },
  name: { fontSize: 22, fontWeight: "bold", color: "green", marginTop: 10 },
  subtitle: { color: "gray", fontSize: 14, marginBottom: 20 },
  header: { fontSize: 18, fontWeight: "bold", color: "green" },
  statValue: { fontSize: 26, fontWeight: "bold", color: "#333", marginTop: 5 },
  subText: { color: "gray", fontSize: 14, marginTop: 5 },
  category: { fontSize: 16, color: "#333", marginTop: 4 },
  button: {
    backgroundColor: "green",
    borderRadius: 8,
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  text: { color: "gray", fontSize: 16 },
});

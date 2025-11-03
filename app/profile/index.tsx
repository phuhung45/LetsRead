// app/profile/ProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

import HeaderDesktop from "../../components/HeaderDesktop";
import FooterDesktop from "../../components/FooterDesktop";
import HeaderMobile from "../../components/HeaderMobile";
import FooterMobile from "../../components/FooterMobile";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [keepReading, setKeepReading] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = Platform.OS === "ios" || Platform.OS === "android";

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ Lấy session trước
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.warn("⚠️ No active session found:", sessionError);
        setUser(null);
        setLoading(false);
        return;
      }

      const currentUser = sessionData.session.user;
      setUser(currentUser);
      const userId = currentUser.id;
      console.log("👤 Current user:", userId);

      // ✅ Tiếp tục fetch dữ liệu profile
      const today = new Date().toISOString().split("T")[0];

      const { data: todayLogs, error: readErr } = await supabase
        .from("reading_logs")
        .select("minutes_read, created_at")
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00Z`);
      if (readErr) console.error("❌ reading_logs error:", readErr);

      const todayMinutes = todayLogs?.reduce((a, x) => a + (x.minutes_read || 0), 0) || 0;

      const { data: booksRead, error: totalErr } = await supabase
        .from("user_reads")
        .select("id")
        .eq("user_id", userId)
        .eq("progress", 1);
      if (totalErr) console.error("❌ user_reads total error:", totalErr);

      const totalBooks = booksRead?.length || 0;

      const { data: topCategoriesData, error: catErr } = await supabase.rpc(
        "get_user_top_categories",
        { uid: userId }
      );
      if (catErr) console.error("❌ get_user_top_categories error:", catErr);

      const topCategories =
        topCategoriesData?.length > 0
          ? topCategoriesData.map((c: any) => ({
              name: c.name,
              icon_url: c.icon_url || "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
            }))
          : [];

      const { data: progressRows, error: keepErr } = await supabase
        .from("user_reads")
        .select("book_id, progress, books:book_id (id, title, cover_image)")
        .eq("user_id", userId)
        .lt("progress", 1)
        .limit(3);
      if (keepErr) console.error("❌ user_reads keepErr:", keepErr);

      const keepBooks = progressRows?.map((r) => r.books).filter(Boolean) || [];

      setStats({
        todayMinutes,
        goal: 20,
        totalBooks,
        topCategories,
      });
      setKeepReading(keepBooks);
    } catch (err) {
      console.error("❌ Error loading profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  const handleNavigate = (route: "home" | "library" | "profile") => {
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
    user?.user_metadata?.avatar_url ||
    "https://cdn-icons-png.flaticon.com/512/1048/1048942.png";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>
          Welcome {user?.user_metadata?.display_name || user?.email}
        </Text>
        <TouchableOpacity
          style={styles.switchProfile}
          onPress={() => router.push("/profile/settings")} // ✅ thêm dòng này
        >
          <Text style={{ color: "green", fontWeight: "600" }}>
            Switch your profile
          </Text>
        </TouchableOpacity>


        <Image source={{ uri: avatarUrl }} style={styles.avatar} />

        {/* ✅ Today's Reading */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Today's Reading</Text>
          <Text style={styles.bigText}>{todayMinutes} min</Text>
          <Text style={styles.subText}>
            Goal:{" "}
            <Text style={{ color: "green", fontWeight: "600" }}>
              {goal} min a day
            </Text>
          </Text>
        </View>

        {/* ✅ Total Books */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Total Books Read
        </Text>
        <Text style={styles.bigText}>{totalBooks}</Text>

        {/* ✅ Top 3 Categories */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Your Top 3 Categories
        </Text>
        <View style={styles.catRow}>
          {topCategories?.length ? (
            topCategories.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={styles.catBox}>
                <Image source={{ uri: c.icon_url }} style={styles.catIcon} />
                <Text style={styles.catText}>{c.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.subText}>No categories yet</Text>
          )}
        </View>

        {/* ✅ Keep Reading */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Keep Reading
        </Text>
        <View style={styles.bookRow}>
          {keepReading?.length ? (
            keepReading.map((b, i) => (
              <TouchableOpacity
                key={i}
                style={styles.bookCard}
                onPress={() => router.push(`/read/${b.id}`)}
              >
                <Image
                  source={{ uri: b.cover_image }}
                  style={styles.bookCover}
                />
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {b.title}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.subText}>No books in progress</Text>
          )}
        </View>
      </ScrollView>

      {isMobile ? (
        <FooterMobile
          active="profile"
          onNavigate={handleNavigate}
          showUsername
          username={user.email}
        />
      ) : (
        <FooterDesktop />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcome: { fontSize: 20, fontWeight: "600", marginTop: 20, color: "#222" },
  switchProfile: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
  },
  avatar: { width: 140, height: 140, resizeMode: "contain", marginTop: 20 },
  card: { alignItems: "center", marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#222" },
  bigText: {
    fontSize: 30,
    fontWeight: "700",
    color: "green",
    marginVertical: 5,
  },
  subText: { fontSize: 14, color: "gray" },
  catRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  catBox: {
    alignItems: "center",
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    elevation: 2,
  },
  catIcon: { width: 50, height: 50, marginBottom: 5 },
  catText: { fontSize: 14, color: "#333" },
  bookRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  bookCard: { alignItems: "center", marginHorizontal: 10, width: 100 },
  bookCover: { width: 100, height: 130, borderRadius: 8 },
  bookTitle: { textAlign: "center", marginTop: 4, fontSize: 13, color: "#333" },
  button: {
    backgroundColor: "green",
    borderRadius: 8,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  text: { color: "gray", fontSize: 16 },
});

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
  Modal,
  TextInput,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

import HeaderDesktop from "../../components/HeaderDesktop";
import FooterDesktop from "../../components/FooterDesktop";
import HeaderMobile from "../../components/HeaderMobile";
import FooterMobile from "../../components/FooterMobile";
import BookDetailPopup from "../../components/BookDetailPopup";

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    todayMinutes: 0,
    goal: 20,
    totalBooks: 0,
    topCategories: [],
    weekData: Array(7).fill(0),
  });
  const [keepReading, setKeepReading] = useState<any[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [showGoalPopup, setShowGoalPopup] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  const isMobile = Platform.OS === "ios" || Platform.OS === "android";

  // ✅ Load user
  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();

      if (error || !sessionData?.session?.user) {
        console.warn("⚠️ No active user session.");
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(sessionData.session.user);
    };

    loadUser();
  }, []);

  // ✅ Load Goal từ user_info
  useEffect(() => {
    if (!user?.id) return;

    const loadGoal = async () => {
      const { data, error } = await supabase
        .from("user_info")
        .select("daily_goal")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setStats((prev) => ({ ...prev, goal: data.daily_goal || 20 }));
      }
    };

    loadGoal();
  }, [user?.id]);

  // ✅ Load stats (reading_logs based)
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      setLoading(true);
      const userId = user.id;
      const today = new Date().toISOString().split("T")[0];

      // 1️⃣ Today's total minutes
      const { data: todayLogs, error: todayErr } = await supabase
        .from("reading_logs")
        .select("minutes_read")
        .eq("user_id", userId)
        .eq("date", today);

      if (todayErr) console.error("❌ todayLogs error:", todayErr);

      const todayMinutes =
        todayLogs?.reduce((a, x) => a + (x.minutes_read || 0), 0) || 0;

      // 2️⃣ Weekly progress
      const now = new Date();
      const day = now.getDay(); // 0 = Sun
      const diffToMonday = (day + 6) % 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diffToMonday);
      const startISO = startOfWeek.toISOString().split("T")[0];

      const { data: weekLogs, error: weekErr } = await supabase
        .from("reading_logs")
        .select("minutes_read, date")
        .eq("user_id", userId)
        .gte("date", startISO);

      if (weekErr) console.error("❌ weekLogs error:", weekErr);

      const weekData = Array(7).fill(0);
      weekLogs?.forEach((log) => {
        const d = new Date(log.date);
        const dayIndex = (d.getDay() + 6) % 7; // shift Sun to end
        weekData[dayIndex] += log.minutes_read || 0;
      });

      // 3️⃣ Total finished books
      const { data: booksRead, error: booksErr } = await supabase
        .from("user_reads")
        .select("id")
        .eq("user_id", userId)
        .eq("progress", 1);

      if (booksErr) console.error("❌ booksRead error:", booksErr);

      const totalBooks = booksRead?.length || 0;

      setStats((prev: any) => ({
        ...prev,
        todayMinutes,
        totalBooks,
        weekData,
      }));

      setLoading(false);
    };

    loadStats();
  }, [user?.id]);

  // ✅ Top categories
  useEffect(() => {
    if (!user?.id) return;

    const loadTopCats = async () => {
      const { data, error } = await supabase.rpc("get_user_top_categories", {
        uid: user.id,
      });

      if (error) {
        console.error("❌ top categories error:", error);
        return;
      }

      const mapped =
        data?.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon_url: c.icon_url,
          read_count: c.read_count
        })) || [];

      setStats((prev: any) => ({
        ...prev,
        topCategories: mapped,
      }));
    };

    loadTopCats();
  }, [user?.id]);

  // ✅ Keep Reading
  useEffect(() => {
    if (!user?.id) return;

    const loadKeepReading = async () => {
      const { data, error } = await supabase
        .from("user_reads")
        .select(
          "book_id, progress, books:book_id (book_uuid, title, cover_image)"
        )
        .eq("user_id", user.id)
        .lt("progress", 1)
        .limit(3);

      if (error) console.error("❌ keepReading error:", error);

      const validBooks = data?.map((r) => r.books).filter((b) => !!b) || [];

      setKeepReading(validBooks);
    };

    loadKeepReading();
  }, [user?.id]);

  // ✅ Save new goal → user_info
  const saveDailyGoal = async () => {
    const g = parseInt(newGoal);

    if (isNaN(g) || g <= 0) {
      alert("Please enter a valid number greater than 0");
      return;
    }

    if (g > 1440) {
      alert("Daily goal cannot exceed 1440 minutes (24 hours)");
      return;
    }

    try {
      const { error } = await supabase.from("user_info").upsert({
        id: user.id, // hoặc user_id nếu cột là user_id
        daily_goal: g,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Error saving goal:", error);
        alert("Failed to save goal. Please try again.");
        return;
      }

      setStats((prev: any) => ({ ...prev, goal: g }));
      setShowGoalPopup(false);
      setNewGoal("");
      console.log("✅ Daily goal saved:", g);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong while saving.");
    }
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

  const { todayMinutes, goal, totalBooks, topCategories, weekData } = stats;
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    "https://cdn-icons-png.flaticon.com/512/1048/1048942.png";

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      {/* ✅ Nội dung có thể cuộn */}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          isMobile && { paddingBottom: 100 }, // tránh footer che
        ]}
        style={{ flex: 1 }}
      >
        <Text style={styles.welcome}>
          Welcome {user?.user_metadata?.display_name || user?.email}
        </Text>

        <TouchableOpacity
          style={styles.switchProfile}
          onPress={() => router.push("/profile/settings")}
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

          {/* ✅ Goal → mở popup */}
          <TouchableOpacity
            style={styles.goalBox}
            onPress={() => {
              setNewGoal(String(goal));
              setShowGoalPopup(true);
            }}
          >
            <Text style={styles.goalText}>
              Goal: <Text style={styles.goalHighlight}>{goal} min a day</Text>
            </Text>

            <Text style={styles.goalArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Weekly Progress */}
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={styles.sectionTitle}>Reading Progress (Mon–Sun)</Text>

          <View style={styles.circleRow}>
            {days.map((d, i) => {
              const minutes = weekData[i];
              const progress = goal > 0 ? minutes / goal : 0;
              const percent = Math.min(progress, 1);

              let borderColor = "#ccc";
              let backgroundColor = "#fff";
              let glowStyle = {};

              if (percent >= 1) {
                borderColor = "green";
                backgroundColor = "#e8fbe8";
                glowStyle = {
                  shadowColor: "green",
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                };
              } else if (percent >= 0.5) {
                borderColor = "#00b894";
                backgroundColor = "#ecfffa";
              } else if (percent > 0) {
                borderColor = "#f1c40f";
                backgroundColor = "#fff9e6";
              }

              return (
                <View
                  key={i}
                  style={[
                    styles.dayCircle,
                    { borderColor, backgroundColor },
                    glowStyle,
                  ]}
                >
                  <Text style={styles.dayCircleText}>{d[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ✅ Total Books Read */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Total Books Read
        </Text>
        <Text style={styles.bigText}>{totalBooks}</Text>

        {/* ✅ Top Categories */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Your Top 3 Categories
        </Text>
        <View style={styles.catRow}>
          {topCategories?.length ? (
            topCategories.slice(0, 3).map((c: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.catBox}
                onPress={() =>
                  router.push(
                    `/search?category_id=${c.id}&category_name=${encodeURIComponent(c.name)}`
                  )
                }


              >
                <Image source={{ uri: c.icon_url }} style={styles.catIcon} />
                <Text style={styles.catText}>{c.name}</Text>
              </TouchableOpacity>
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
              onPress={() => {
                setSelectedBookId(b.book_uuid);
                setPopupVisible(true);
              }}
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
      {/* ✅ BOOK POPUP */}
      {popupVisible && selectedBookId && (
        <BookDetailPopup
          visible={popupVisible}
          bookId={selectedBookId}
          onClose={() => setPopupVisible(false)}
        />
      )}

      {/* ✅ FOOTER */}
      {isMobile ? (
      <View style={styles.mobileFooterWrapper}>
        <FooterMobile
          active="profile"
          onNavigate={handleNavigate}
          showUsername
          username={user.email}
        />
          </View>
        ) : (
          // ✅ chỉ render FooterDesktop bên trong ScrollView
          <View style={{ width: "100%", marginTop: 50 }}>
            <FooterDesktop />
          </View>
        )}


      {/* ✅ POPUP SET DAILY GOAL */}
      <Modal visible={showGoalPopup} transparent animationType="fade">
        <View style={popupStyles.overlay}>
          <View style={popupStyles.popup}>
            <Text style={popupStyles.title}>Set Daily Goal</Text>

            <TextInput
              style={popupStyles.input}
              keyboardType="numeric"
              value={newGoal}
              onChangeText={setNewGoal}
            />

            <TouchableOpacity style={popupStyles.saveBtn} onPress={saveDailyGoal}>
              <Text style={popupStyles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowGoalPopup(false)}>
              <Text style={popupStyles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== POPUP STYLE ====================
const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  popup: {
    width: Platform.OS === "ios" || Platform.OS === "android" ? "80%" : "20%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  input: {
    width: "80%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: "green",
    width: "80%",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  cancel: {
    color: "gray",
    fontSize: 16,
    marginTop: 5,
  },
});

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 20 },
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
  goalBox: {
    width: Platform.OS === "ios" || Platform.OS === "android" ? "85%" : "120%",
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalText: { fontSize: 16, color: "#333" },
  goalHighlight: { fontWeight: "700", color: "green" },
  goalArrow: { fontSize: 22, color: "green" },
  circleRow: { flexDirection: "row", marginTop: 10 },
  dayCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  dayCircleText: { fontSize: 14, fontWeight: "600" },
  mobileFooterWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
});

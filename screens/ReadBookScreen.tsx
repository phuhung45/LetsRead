import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { decode } from "he";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Switch,
  ScrollView,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get("window");

export default function ReadBookScreen() {
  const params = useLocalSearchParams();
  const cleanBookUuid = (params.book_uuid ?? "").toString().trim();
  const cleanLanguageId = (params.bookLang ?? "").toString().trim();

  const [pages, setPages] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState(cleanLanguageId);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>("");

  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const flatRef = useRef<FlatList<any> | null>(null);
  const pageScrollRefs = useRef<any[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const readingTimer = useRef<NodeJS.Timeout | null>(null);

  const [iosLangModal, setIosLangModal] = useState(false);

  /* =================== FETCH DATA =================== */
  useEffect(() => {
    let mounted = true;
    const fetchBookData = async () => {
      try {
        setLoading(true);

        const { data: bookInfoData } = await supabase
          .from("book_content")
          .select("pdf_url, epub_url, title")
          .eq("book_id", cleanBookUuid)
          .eq("language_id", selectedLang)
          .maybeSingle();

        setPdfUrl(bookInfoData?.pdf_url || null);
        setEpubUrl(bookInfoData?.epub_url || null);
        setBookTitle(bookInfoData?.title || "Untitled");

        const { data } = await supabase
          .from("book_content_page")
          .select("book_uuid, language_id, page, image, content_value")
          .eq("book_uuid", cleanBookUuid)
          .eq("language_id", selectedLang)
          .order("page");

        setPages(data || []);
      } finally {
        setLoading(false);
      }
    };

    const fetchLanguages = async () => {
      const { data } = await supabase
        .from("book_content_page")
        .select("language_id")
        .eq("book_uuid", cleanBookUuid);

      const uniqueIds = Array.from(new Set(data?.map((d) => d.language_id)));

      const { data: langs } = await supabase
        .from("languages")
        .select("id, name")
        .in("id", uniqueIds);

      setLanguages(langs || []);
      if (!selectedLang && langs?.[0]?.id) setSelectedLang(langs[0].id);
    };

    fetchLanguages();
    fetchBookData();

    return () => {
      mounted = false;
    };
  }, [cleanBookUuid, selectedLang]);

  /* =================== CLEAN HTML =================== */
  const cleanHTML = (html: string) =>
    decode(
      html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, "").trim()
    );

  /* =================== TRACK READING =================== */
async function trackBookRead(
  bookId: string,
  languageId: string,
  currentIdx: number,
  totalPages: number
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) return;
  const userId = user.user.id;

  const currentProgress = (currentIdx + 1) / totalPages;

  try {
    const { data: existing } = await supabase
      .from("user_reads")
      .select("id, progress")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("language_id", languageId)
      .maybeSingle();

    if (existing) {
      // chỉ update nếu progress mới cao hơn
      if (currentProgress > existing.progress) {
        await supabase
          .from("user_reads")
          .update({
            progress: currentProgress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }
    } else {
      // chưa có bản ghi → insert
      await supabase.from("user_reads").insert([
        {
          user_id: userId,
          book_id: bookId,
          language_id: languageId,
          progress: currentProgress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (err) {
    console.error("❌ trackBookRead error:", err);
  }
}




  /* =================== READING LOG REALTIME =================== */
  async function saveReadingLog() {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;
    const userId = user.user.id;

    if (!startTimeRef.current) return;

    const now = Date.now();
    const diffMs = now - startTimeRef.current;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes <= 0) return;

    const today = new Date().toISOString().split("T")[0];
    console.debug(`🕒 [ReadingLog] +${minutes} min for ${cleanBookUuid}`);

    const { data: existing, error: selErr } = await supabase
      .from("reading_logs")
      .select("id, minutes_read")
      .eq("user_id", userId)
      .eq("book_uuid", cleanBookUuid)
      .eq("date", today)
      .maybeSingle();

    if (selErr) {
      console.error("❌ reading_logs select error:", selErr);
      return;
    }

    const nowISO = new Date().toISOString();

    if (existing) {
      const total = existing.minutes_read + minutes;
      const { error: upErr } = await supabase
        .from("reading_logs")
        .update({
          minutes_read: total,
          updated_at: nowISO,
          last_read_at: nowISO,
        })
        .eq("id", existing.id);
      if (upErr) console.error("❌ Update error:", upErr);
    } else {
      const { error: insErr } = await supabase.from("reading_logs").insert([
        {
          user_id: userId,
          book_uuid: cleanBookUuid,
          date: today,
          minutes_read: minutes,
          updated_at: nowISO,
          last_read_at: nowISO,
        },
      ]);
      if (insErr) console.error("❌ Insert error:", insErr);
    }

    startTimeRef.current = Date.now();
  }

  const startReadingSession = () => {
    startTimeRef.current = Date.now();
    if (readingTimer.current) clearInterval(readingTimer.current);
    readingTimer.current = setInterval(() => {
      saveReadingLog();
    }, 60000);
  };

  const stopReadingSession = () => {
    if (readingTimer.current) {
      clearInterval(readingTimer.current);
      readingTimer.current = null;
    }
    saveReadingLog();
  };

  useEffect(() => {
    startReadingSession();
    return () => stopReadingSession();
  }, []);

  /* =================== RENDER PAGE =================== */
  const renderPage = ({ item, index }) => {
    const imageHeight = Math.min(height * 0.5, 1200);

    return (
      <View style={{ width }}>
        <ScrollView
          ref={(ref) => (pageScrollRefs.current[index] = ref)}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 160,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={{
                width,
                height: imageHeight,
                resizeMode: "contain",
                marginBottom: 20,
              }}
            />
          )}

          <Text
            style={{
              fontSize: 22,
              lineHeight: 28,
              textAlign: "justify",
              color: darkMode ? "#f1f1f1" : "#111",
              paddingHorizontal: Math.min(24, width * 0.05),
            }}
          >
            {cleanHTML(item.content_value || "")}
          </Text>
        </ScrollView>
      </View>
    );
  };

  /* =================== PAGE SCROLL =================== */
  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== currentIndex) setCurrentIndex(idx);
    if (pages.length)
      trackBookRead(cleanBookUuid, selectedLang, idx, pages.length);
  };

  /* =================== RENDER PICKER =================== */
  const renderLangPicker = () => {
    const selectedLangName =
      languages.find((l) => l.id === selectedLang)?.name || "Select";

    if (Platform.OS === "ios") {
      return (
        <>
          <TouchableOpacity
            style={[
              styles.langPickerBtn,
              { backgroundColor: darkMode ? "#333" : "#fff" },
            ]}
            onPress={() => languages.length > 0 && setIosLangModal(true)}
            disabled={languages.length === 0}
          >
            <Text style={{ color: darkMode ? "#fff" : "#000", fontSize: 16 }}>
              {selectedLangName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={darkMode ? "#fff" : "#000"}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          <Modal
            visible={iosLangModal}
            transparent
            animationType="fade"
            onRequestClose={() => setIosLangModal(false)}
          >
            <Pressable
              style={styles.iosPickerOverlay}
              onPress={() => setIosLangModal(false)}
            >
              <View style={[styles.iosPickerBox, { maxHeight: height * 0.5 }]}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                    padding: 10,
                  }}
                >
                  Select Language
                </Text>
                <FlatList
                  data={languages}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedLang(item.id);
                        setIosLangModal(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                        backgroundColor: darkMode ? "#333" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          color: darkMode ? "#fff" : "#000",
                          fontSize: 16,
                        }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>
        </>
      );
    }

    // Android giữ nguyên
    return (
      <View
        style={[
          styles.langPicker,
          { backgroundColor: darkMode ? "#333" : "#fff", marginTop: 20 },
        ]}
      >
        <Picker
          selectedValue={selectedLang}
          onValueChange={(v) => setSelectedLang(v)}
          dropdownIconColor={darkMode ? "#fff" : "#000"}
          style={{ width: "100%", height: 40, color: darkMode ? "#fff" : "#000" }}
        >
          {languages.length > 0 ? (
            languages.map((lang) => (
              <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
            ))
          ) : (
            <Picker.Item label="Loading..." value="" />
          )}
        </Picker>
      </View>
    );
  };

  /* =================== UI =================== */
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading book...</Text>
      </View>
    );

  if (pages.length === 0)
    return (
      <View style={styles.center}>
        <Text>No pages found 😢</Text>
      </View>
    );

  const backgroundColor = darkMode ? "#111" : "#fff";
  const textColor = darkMode ? "#f1f1f1" : "#111";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: darkMode ? "#222" : "#f0f0f0" },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Ionicons name="arrow-back" size={26} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {bookTitle}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          {renderLangPicker()}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Switch value={darkMode} onValueChange={setDarkMode} />
          <TouchableOpacity onPress={() => setShowDownloadPopup(true)}>
            <Text style={{ fontSize: 18, color: "green" }}>⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PAGES */}
      <FlatList
        ref={flatRef}
        horizontal
        pagingEnabled
        data={pages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderPage}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={currentIndex}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        windowSize={3}
        maxToRenderPerBatch={2}
      />

      {/* PAGE INDICATOR */}
      <View style={styles.pageIndicatorWrap}>
        <View
          style={[
            styles.pageIndicator,
            {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.25)",
            },
          ]}
        >
          <Text
            style={{
              color: darkMode ? "#fff" : "#000",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            {currentIndex + 1} / {pages.length}
          </Text>
        </View>
      </View>

      {/* NAV BUTTONS */}
      <TouchableOpacity
        style={[styles.sideNavBtn, { left: 10 }]}
        disabled={currentIndex === 0}
        onPress={() => {
          if (currentIndex > 0) {
            flatRef.current?.scrollToIndex({
              index: currentIndex - 1,
              animated: true,
            });
            setCurrentIndex(currentIndex - 1);
            trackBookRead(
              cleanBookUuid,
              selectedLang,
              currentIndex - 1,
              pages.length
            );
          }
        }}
      >
        <Ionicons name="chevron-back" size={30} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sideNavBtn, { right: 10 }]}
        disabled={currentIndex === pages.length - 1}
        onPress={() => {
          if (currentIndex < pages.length - 1) {
            flatRef.current?.scrollToIndex({
              index: currentIndex + 1,
              animated: true,
            });
            setCurrentIndex(currentIndex + 1);
            trackBookRead(
              cleanBookUuid,
              selectedLang,
              currentIndex + 1,
              pages.length
            );
          }
        }}
      >
        <Ionicons name="chevron-forward" size={30} color="#fff" />
      </TouchableOpacity>

      {/* DOWNLOAD POPUP */}
      <Modal
        visible={showDownloadPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Download Options</Text>

            {pdfUrl && (
              <Pressable
                onPress={() => Linking.openURL(pdfUrl)}
                style={styles.modalRow}
              >
                <Text style={styles.modalRowText}>📄 PDF</Text>
              </Pressable>
            )}

            {epubUrl && (
              <Pressable
                onPress={() => Linking.openURL(epubUrl)}
                style={styles.modalRow}
              >
                <Text style={styles.modalRowText}>📘 EPUB</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowDownloadPopup(false)}
              style={styles.modalRow}
            >
              <Text style={[styles.modalRowText, { color: "red" }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =================== STYLES =================== */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "6%",
    paddingRight: "6%",
    paddingVertical: 10,
  },
  title: { fontSize: 18, fontWeight: "600", maxWidth: width * 0.4 },
  langPicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 160,
    overflow: "hidden",
  },
  langPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  iosPickerBox: {
    backgroundColor: "#fff",
  },
  iosPickerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: 8,
    alignItems: "flex-end",
  },
  pageIndicatorWrap: {
    position: "absolute",
    bottom: 70,
    width: "100%",
    alignItems: "center",
  },
  pageIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sideNavBtn: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  modalRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalRowText: {
    fontSize: 16,
    textAlign: "center",
  },
});

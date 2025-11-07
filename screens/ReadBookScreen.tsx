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
  const pageScrollRefs = useRef([]);

  /* ========== FETCH DATA ========== */
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

        const info = bookInfoData;

        setPdfUrl(info?.pdf_url || null);
        setEpubUrl(info?.epub_url || null);
        setBookTitle(info?.title || "Untitled");

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
    };

    fetchLanguages();
    fetchBookData();

    return () => (mounted = false);
  }, [cleanBookUuid, selectedLang]);

  /* ========== CLEAN HTML ========== */
  const cleanHTML = (html: string) =>
    decode(
      html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .trim()
    );

  /* ========== RENDER PAGE ========== */
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

  /* ========== HANDLE PAGE SWIPE ========== */
  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== currentIndex) setCurrentIndex(idx);
  };

  /* ========== RENDER UI ========== */

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
        style={[styles.header, { backgroundColor: darkMode ? "#222" : "#f0f0f0" }]}
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
          <View
            style={[
              styles.langPicker,
              { backgroundColor: darkMode ? "#333" : "#fff" },
            ]}
          >
            <Picker
              selectedValue={selectedLang}
              style={{ width: "100%", height: 38, color: textColor }}
              onValueChange={(v) => setSelectedLang(v)}
            >
              {languages.map((lang) => (
                <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Switch value={darkMode} onValueChange={setDarkMode} />
          <TouchableOpacity onPress={() => setShowDownloadPopup(true)}>
            <Text style={{ fontSize: 18, color: "green" }}>⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLATLIST */}
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
            { backgroundColor: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)" },
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

      {/* PREV BUTTON - LEFT SIDE */}
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
          }
        }}
      >
        <Ionicons name="chevron-back" size={30} color="#fff" />
      </TouchableOpacity>

      {/* NEXT BUTTON - RIGHT SIDE */}
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
              <Pressable onPress={() => Linking.openURL(pdfUrl)} style={styles.modalRow}>
                <Text style={styles.modalRowText}>📄 PDF</Text>
              </Pressable>
            )}

            {epubUrl && (
              <Pressable onPress={() => Linking.openURL(epubUrl)} style={styles.modalRow}>
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

/* ========== STYLES ========== */
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

  pageIndicatorWrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  /* === NEW NEXT/PREV BUTTONS ON LEFT/RIGHT === */
  sideNavBtn: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 12,
    borderRadius: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    width: Platform.OS === "web" ? "40%" : "80%",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  modalRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalRowText: { fontSize: 16, textAlign: "center" },
});

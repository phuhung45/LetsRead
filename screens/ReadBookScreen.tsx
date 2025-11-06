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
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get("window");

/**
 * ReadBookScreen — optimized for mobile:
 * - FlatList paging (stable)
 * - Accumulator timer to prevent overcounting
 * - Minimal network calls (only when adding 1 minute or progress changes)
 * - Reset accumulator on manual navigation / swipe
 * - Safer image sizing to avoid OOM
 */

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

  /* ---------------------------- FETCH BOOK DATA ---------------------------- */
  useEffect(() => {
    if (!cleanBookUuid) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchBookData = async () => {
      try {
        setLoading(true);

        const { data: bookInfoData } = await supabase
          .from("book_content")
          .select("pdf_url, epub_url, title")
          .eq("book_id", cleanBookUuid)
          .eq("language_id", selectedLang)
          .limit(1)
          .maybeSingle();

        if (!bookInfoData) {
          const { data: fallbackBook } = await supabase
            .from("book_content")
            .select("pdf_url, epub_url, title")
            .eq("book_id", cleanBookUuid)
            .limit(1)
            .maybeSingle();

          if (!mounted) return;
          setPdfUrl(fallbackBook?.pdf_url || null);
          setEpubUrl(fallbackBook?.epub_url || null);
          setBookTitle(fallbackBook?.title || "Untitled");
        } else {
          if (!mounted) return;
          setPdfUrl(bookInfoData.pdf_url || null);
          setEpubUrl(bookInfoData.epub_url || null);
          setBookTitle(bookInfoData.title || "Untitled");
        }

        // pages (limit reasonable to avoid giant payload)
        const { data } = await supabase
          .from("book_content_page")
          .select("book_uuid, language_id, page, image, content_value")
          .eq("book_uuid", cleanBookUuid)
          .eq("language_id", selectedLang)
          .order("page");

        let pagesData = data || [];

        if ((!pagesData || pagesData.length === 0) && mounted) {
          const { data: fallbackData } = await supabase
            .from("book_content_page")
            .select("book_uuid, language_id, page, image, content_value")
            .eq("book_uuid", cleanBookUuid)
            .order("page")
            .limit(200);

          pagesData = fallbackData || [];
        }

        if (mounted) setPages(pagesData || []);
      } catch (e) {
        console.error("fetchBookData error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchLanguages = async () => {
      try {
        const { data } = await supabase
          .from("book_content_page")
          .select("language_id")
          .eq("book_uuid", cleanBookUuid);

        const uniqueIds = Array.from(new Set(data?.map((d) => d.language_id)));

        if (uniqueIds.length > 0) {
          const { data: langs } = await supabase
            .from("languages")
            .select("id, name")
            .in("id", uniqueIds);

          if (mounted) setLanguages(langs || []);
        }
      } catch (e) {
        console.error("fetchLanguages error:", e);
      }
    };

    fetchLanguages();
    fetchBookData();

    return () => {
      mounted = false;
    };
  }, [cleanBookUuid, selectedLang]);

  /* ---------------------------- CLEAN HTML ---------------------------- */
  const cleanHTML = (html: string) =>
    decode(
      html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<i>(.*?)<\/i>/gi, "_$1_")
        .replace(/<small>(.*?)<\/small>/gi, "$1")
        .replace(/&nbsp;/g, " ")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .trim()
    );

  /* ---------------------------- ACCUMULATOR REALTIME (NO OVERCOUNT) ---------------------------- */

  // lastTick: timestamp of previous tick
  const lastTick = useRef<number>(Date.now());
  // elapsedMs: accumulated ms since last full minute consumed
  const elapsedMs = useRef<number>(0);
  // readingActive: allows pausing accumulation if needed
  const readingActive = useRef<boolean>(true);
  // ensure we don't run multiple concurrent addOneMinute
  const addingLock = useRef<boolean>(false);

  // 5s tick — triggers accumulation logic. 5s chosen to reduce throttling issues on RN
  useEffect(() => {
    lastTick.current = Date.now();
    elapsedMs.current = 0;

    const tick = setInterval(() => {
      handleRealtimeTick();
    }, 5000);

    return () => {
      clearInterval(tick);
      // flush any full minutes on unmount/book change
      flushAccumulator();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanBookUuid]); // reset when book changes

  const handleRealtimeTick = async () => {
    if (!readingActive.current) {
      lastTick.current = Date.now();
      return;
    }

    const now = Date.now();
    const delta = now - lastTick.current;
    lastTick.current = now;
    elapsedMs.current += delta;

    // consume whole minute chunks
    while (elapsedMs.current >= 60000) {
      // if an add is already running, break to avoid concurrent upserts
      if (addingLock.current) break;
      elapsedMs.current -= 60000;
      await addOneMinute();
    }
  };

  const flushAccumulator = async () => {
    // consume any full minutes
    while (elapsedMs.current >= 60000) {
      elapsedMs.current -= 60000;
      await addOneMinute();
    }
  };

  const addOneMinute = async () => {
    if (addingLock.current) return;
    addingLock.current = true;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        addingLock.current = false;
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // fetch existing minutes safely
      const { data: existing } = await supabase
        .from("reading_logs")
        .select("minutes_read")
        .eq("user_id", user.id)
        .eq("book_uuid", cleanBookUuid)
        .eq("date", today)
        .maybeSingle();

      const current = existing?.minutes_read ?? 0;
      const newTotal = current + 1;

      // minimal upsert payload
      await supabase.from("reading_logs").upsert(
        {
          user_id: user.id,
          book_uuid: cleanBookUuid,
          date: today,
          minutes_read: newTotal,
          last_read_at: new Date().toISOString(),
          // do not send created_at — DB should default it
        },
        { onConflict: ["user_id", "book_uuid", "date"] }
      );

      console.log(`🕒 +1 minute -> total=${newTotal}`);
    } catch (e) {
      console.error("addOneMinute error:", e);
    } finally {
      addingLock.current = false;
    }
  };

  /* ---------------------------- READING PROGRESS ---------------------------- */

  const updateUserReadingProgress = async (progress: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("user_reads")
        .select("progress")
        .eq("user_id", user.id)
        .eq("book_id", cleanBookUuid)
        .maybeSingle();

      const currentProgress = existing?.progress ?? 0;
      if (currentProgress === 1) return;
      if (progress <= currentProgress) return;

      await supabase.from("user_reads").upsert(
        {
          user_id: user.id,
          book_id: cleanBookUuid,
          progress,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,book_id" }
      );
    } catch (e) {
      console.log("reading progress error:", e);
    }
  };

  /* ---------------------------- NAVIGATION HANDLERS ---------------------------- */

  const goToIndex = async (index: number) => {
    if (!pages || pages.length === 0) return;
    const clamped = Math.max(0, Math.min(index, pages.length - 1));
    flatRef.current?.scrollToIndex({ index: clamped, animated: true });
    setCurrentIndex(clamped);
  };

  const onNext = async () => {
    if (currentIndex < pages.length - 1) {
      const nextIndex = currentIndex + 1;
      await goToIndex(nextIndex);

      const progress =
        nextIndex + 1 >= pages.length ? 1 : (nextIndex + 1) / pages.length;

      // reset accumulator when user manually navigates pages
      lastTick.current = Date.now();
      elapsedMs.current = 0;

      await updateUserReadingProgress(progress);
    } else {
      // finished
      lastTick.current = Date.now();
      elapsedMs.current = 0;
      await updateUserReadingProgress(1);
    }
  };

  const onPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
      // reset accumulator
      lastTick.current = Date.now();
      elapsedMs.current = 0;
    }
  };

  /* ---------------------------- DOWNLOAD ---------------------------- */

  const openDownloadPopup = () => {
    if (!pdfUrl && !epubUrl) return;
    setShowDownloadPopup(true);
  };

  const handleDownload = async (type: "pdf" | "epub") => {
    setShowDownloadPopup(false);
    const fileUrl = type === "pdf" ? pdfUrl : epubUrl;
    if (fileUrl) Linking.openURL(fileUrl);
  };

  /* ---------------------------- FLATLIST ITEM RENDERER ---------------------------- */

  const renderPage = ({ item, index }: { item: any; index: number }) => {
    // scale image down to device width to avoid OOM
    const imageHeight = Math.min(height * 0.5, 1200); // cap height
    return (
      <View style={{ width, alignItems: "center", padding: 20 }}>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={{
              width,
              height: imageHeight,
              resizeMode: "contain",
              marginBottom: 20,
              backgroundColor: "#f6f6f6",
            }}
            // react-native-web ignores defaultSource; keep minimal props
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
      </View>
    );
  };

  const handleMomentumScrollEnd = async (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / width);
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
      // reset accumulator when user swipes
      lastTick.current = Date.now();
      elapsedMs.current = 0;
    }
  };

  /* ---------------------------- RENDER UI ---------------------------- */

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
      <View style={[styles.header, { backgroundColor: darkMode ? "#222" : "#f0f0f0" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Ionicons name="arrow-back" size={26} color={textColor} />
          </TouchableOpacity>

          <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
            {bookTitle || "Book"}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={[styles.langPicker, { backgroundColor: darkMode ? "#333" : "#fff" }]}>
            <Picker
              selectedValue={selectedLang}
              style={{ width: "100%", height: 38, color: textColor }}
              onValueChange={(value) => setSelectedLang(value)}
            >
              {languages.map((lang) => (
                <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Switch value={darkMode} onValueChange={setDarkMode} />
          <TouchableOpacity onPress={openDownloadPopup}>
            <Text style={{ fontSize: 20, color: "green" }}>Download ⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLATLIST PAGING */}
      <FlatList
        ref={(r) => (flatRef.current = r)}
        horizontal
        pagingEnabled
        data={pages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderPage}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={currentIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />

      {/* PREV / NEXT BUTTONS */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={currentIndex === 0}
          style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={currentIndex === pages.length - 1}
          style={[styles.navBtn, currentIndex === pages.length - 1 && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PAGE INDICATOR */}
      <View style={styles.pageIndicatorWrap}>
        <View style={[styles.pageIndicator, { backgroundColor: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)" }]}>
          <Text style={{ color: darkMode ? "#fff" : "#000", fontSize: 16, fontWeight: "700" }}>
            {currentIndex + 1} / {pages.length}
          </Text>
        </View>
      </View>

      {/* DOWNLOAD POPUP */}
      <Modal visible={showDownloadPopup} transparent animationType="fade" onRequestClose={() => setShowDownloadPopup(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Download Options</Text>

            {pdfUrl && (
              <Pressable onPress={() => handleDownload("pdf")} style={styles.modalRow}>
                <Text style={styles.modalRowText}>📄 Download PDF</Text>
              </Pressable>
            )}

            {epubUrl && (
              <Pressable onPress={() => handleDownload("epub")} style={styles.modalRow}>
                <Text style={styles.modalRowText}>📘 Download EPUB</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setShowDownloadPopup(false)} style={styles.modalRow}>
              <Text style={[styles.modalRowText, { color: "red" }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ==================== STYLES ==================== */
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
  controls: {
    position: "absolute",
    top: "50%",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  pageIndicatorWrap: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
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
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  modalRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalRowText: { fontSize: 16, textAlign: "center" },
});

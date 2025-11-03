import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  Text,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams, router } from "expo-router";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import { decode } from "he";
import { Picker } from "@react-native-picker/picker";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";

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

  const swiperRef = useRef<any>(null);

  // 🧩 FETCH BOOK + LANGUAGES
  useEffect(() => {
    if (!cleanBookUuid) {
      setLoading(false);
      return;
    }

    const fetchBookData = async () => {
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

        setPdfUrl(fallbackBook?.pdf_url || null);
        setEpubUrl(fallbackBook?.epub_url || null);
        setBookTitle(fallbackBook?.title || "Untitled");
      } else {
        setPdfUrl(bookInfoData.pdf_url || null);
        setEpubUrl(bookInfoData.epub_url || null);
        setBookTitle(bookInfoData.title || "Untitled");
      }

      // 🧠 Lấy danh sách trang
      let { data } = await supabase
        .from("book_content_page")
        .select("book_uuid, language_id, page, image, content_value")
        .eq("book_uuid", cleanBookUuid)
        .eq("language_id", selectedLang)
        .order("page");

      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from("book_content_page")
          .select("book_uuid, language_id, page, image, content_value")
          .eq("book_uuid", cleanBookUuid)
          .order("page")
          .limit(20);

        data = fallbackData || [];
      }

      setPages(data || []);
      setLoading(false);
    };

    const fetchLanguages = async () => {
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

        setLanguages(langs || []);
      }
    };

    fetchLanguages();
    fetchBookData();
  }, [cleanBookUuid, selectedLang]);

  // 🧹 Clean HTML
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

  // ✅ Ghi lại tiến độ đọc
  const updateUserReadingProgress = async (progress: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("user_reads").upsert(
        {
          user_id: user.id,
          book_id: cleanBookUuid,
          progress,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,book_id" }
      );

      if (error) console.log("❌ upsert user_reads error:", error);
      else console.log("✅ Updated progress:", progress);
    } catch (e) {
      console.log("reading progress error:", e);
    }
  };

  // ✅ Khi Next
  const goNext = async () => {
    if (currentIndex < pages.length - 1) {
      const nextIndex = currentIndex + 1;
      swiperRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);

      // 🔹 Tính progress (0 → 1)
      const progress =
        nextIndex + 1 >= pages.length
          ? 1
          : (nextIndex + 1) / pages.length;

      await updateUserReadingProgress(progress);
    } else {
      await updateUserReadingProgress(1);
      console.log("🎉 Completed reading this book!");
    }
  };

  // ⬅️ Prev
  const goPrev = () => {
    if (currentIndex > 0) {
      swiperRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 📥 Popup download
  const openDownloadPopup = () => {
    if (!pdfUrl && !epubUrl) return;
    setShowDownloadPopup(true);
  };

  const handleDownload = async (type: "pdf" | "epub") => {
    setShowDownloadPopup(false);
    const fileUrl = type === "pdf" ? pdfUrl : epubUrl;
    if (fileUrl) Linking.openURL(fileUrl);
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading book...</Text>
      </View>
    );

  if (pages.length === 0)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No pages found 😢</Text>
      </View>
    );

  const backgroundColor = darkMode ? "#111" : "#fff";
  const textColor = darkMode ? "#f1f1f1" : "#111";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "15%",
          paddingRight: "15%",
          paddingVertical: 10,
          backgroundColor: darkMode ? "#222" : "#f0f0f0",
        }}
      >
        {/* Back + Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Ionicons name="arrow-back" size={26} color={textColor} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={{
              color: textColor,
              fontSize: 18,
              fontWeight: "600",
              maxWidth: width * 0.4,
            }}
          >
            {bookTitle || "Book"}
          </Text>
        </View>

        {/* Picker */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              width: 160,
              overflow: "hidden",
              backgroundColor: darkMode ? "#333" : "#fff",
            }}
          >
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

        {/* Dark mode & Download */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Switch value={darkMode} onValueChange={setDarkMode} />
          <TouchableOpacity onPress={openDownloadPopup}>
            <Text style={{ fontSize: 20, color: "green" }}>Download ⬇️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ SWIPER */}
      <SwiperFlatList
        ref={swiperRef}
        showPagination
        paginationStyleItemInactive={{ width: 8, height: 8, opacity: 0.3 }}
        paginationStyleItemActive={{ opacity: 1 }}
        onChangeIndex={({ index }) => setCurrentIndex(index)}
      >
        {pages.map((page, index) => (
          <ScrollView
            key={index}
            contentContainerStyle={{
              width,
              alignItems: "center",
              padding: 20,
            }}
          >
            {page.image && (
              <Image
                source={{ uri: page.image }}
                style={{
                  width,
                  height: height * 0.5,
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
                color: textColor,
                paddingHorizontal: width * 0.2,
              }}
            >
              {cleanHTML(page.content_value || "")}
            </Text>
          </ScrollView>
        ))}
      </SwiperFlatList>

      {/* ✅ PREV / NEXT */}
      <View
        style={{
          position: "absolute",
          top: "50%",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 30,
            opacity: currentIndex === 0 ? 0.2 : 1,
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          disabled={currentIndex === pages.length - 1}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 30,
            opacity: currentIndex === pages.length - 1 ? 0.2 : 1,
          }}
        >
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* POPUP */}
      <Modal
        visible={showDownloadPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadPopup(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              width: "60%",
              borderRadius: 12,
              paddingVertical: 20,
              paddingHorizontal: 10,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              Download Options
            </Text>

            {pdfUrl && (
              <Pressable
                onPress={() => handleDownload("pdf")}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ddd",
                }}
              >
                <Text style={{ fontSize: 16, textAlign: "center" }}>
                  📄 Download PDF
                </Text>
              </Pressable>
            )}

            {epubUrl && (
              <Pressable
                onPress={() => handleDownload("epub")}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ddd",
                }}
              >
                <Text style={{ fontSize: 16, textAlign: "center" }}>
                  📘 Download EPUB
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowDownloadPopup(false)}
              style={{ paddingVertical: 12 }}
            >
              <Text
                style={{ fontSize: 16, textAlign: "center", color: "red" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

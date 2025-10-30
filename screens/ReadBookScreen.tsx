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
  Alert,
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
  const [bookTitle, setBookTitle] = useState<string>("");

  const swiperRef = useRef<any>(null);

  // 🔹 Fetch dữ liệu chính
  useEffect(() => {
    if (!cleanBookUuid) {
      setLoading(false);
      return;
    }

    const fetchBookData = async () => {
      // ✅ Lấy bản ghi đúng ngôn ngữ
      const { data: bookInfoData, error: bookInfoError } = await supabase
        .from("book_content")
        .select("pdf_url, title, language_id")
        .eq("book_id", cleanBookUuid)
        .eq("language_id", selectedLang)
        .maybeSingle();

      if (bookInfoError)
        console.error("❌ Book info fetch error:", bookInfoError);

      if (bookInfoData) {
        setPdfUrl(bookInfoData.pdf_url || null);
        setBookTitle(bookInfoData.title || "");
      } else {
        // fallback: nếu không có đúng lang
        const { data: fallbackBook } = await supabase
          .from("book_content")
          .select("pdf_url, title")
          .eq("book_id", cleanBookUuid)
          .limit(1)
          .maybeSingle();
        setPdfUrl(fallbackBook?.pdf_url || null);
        setBookTitle(fallbackBook?.title || "");
      }

      // 🔹 Lấy pages theo ngôn ngữ
      let { data, error } = await supabase
        .from("book_content_page")
        .select("book_uuid, language_id, page, image, content_value")
        .eq("book_uuid", cleanBookUuid)
        .eq("language_id", selectedLang)
        .order("page", { ascending: true });

      if (error) console.error("❌ Supabase error:", error);

      // fallback nếu trống
      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from("book_content_page")
          .select("book_uuid, language_id, page, image, content_value")
          .eq("book_uuid", cleanBookUuid)
          .order("page", { ascending: true })
          .limit(20);
        data = fallbackData || [];
      }

      setPages(data || []);
      setLoading(false);
    };

    const fetchLanguages = async () => {
      // 🔹 Lấy danh sách language có trong book
      const { data, error } = await supabase
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

  // 🔹 Xử lý HTML → text thuần
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

  const goNext = () => {
    if (currentIndex < pages.length - 1) {
      swiperRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      swiperRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) {
      Alert.alert("No PDF available for this book.");
      return;
    }
    Linking.openURL(pdfUrl);
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading book pages...</Text>
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
      {/* 🔹 Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          paddingVertical: 10,
          backgroundColor: darkMode ? "#222" : "#f0f0f0",
        }}
      >
        {/* 🔙 Back + Title bên trái */}
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Ionicons name="arrow-back" size={26} color={textColor} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              color: textColor,
              fontSize: 18,
              fontWeight: "600",
              marginLeft: 10,
              maxWidth: width * 0.4,
            }}
          >
            {bookTitle || "Book"}
          </Text>
        </View>

        {/* 🌐 Picker Language ở giữa */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Picker
            selectedValue={selectedLang}
            style={{
              width: 160,
              height: 38,
              color: textColor,
            }}
            onValueChange={(value) => setSelectedLang(value)}
          >
            {languages.map((lang) => (
              <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
            ))}
          </Picker>
        </View>

        {/* 🌙 Dark mode + Download bên phải */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            flex: 1,
            gap: 8,
          }}
        >
          <Switch value={darkMode} onValueChange={setDarkMode} />
          <TouchableOpacity onPress={handleDownload}>
            <Ionicons name="download-outline" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Swiper nội dung */}
      <SwiperFlatList
        ref={swiperRef}
        showPagination
        paginationStyleItemInactive={{
          width: 8,
          height: 8,
          opacity: 0.3,
        }}
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
            {page.image ? (
              <Image
                source={{ uri: page.image }}
                style={{
                  width,
                  height: height * 0.5,
                  resizeMode: "contain",
                  marginBottom: 20,
                }}
              />
            ) : null}

            <Text
              style={{
                fontSize: 22,
                lineHeight: 28,
                textAlign: "justify",
                color: textColor,
                paddingHorizontal: width * 0.32,
              }}
            >
              {cleanHTML(page.content_value || "")}
            </Text>
          </ScrollView>
        ))}
      </SwiperFlatList>

      {/* 🔹 Nút chuyển trang */}
      <View
        style={{
          position: "absolute",
          top: "45%",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 10,
        }}
      >
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 50,
          }}
        >
          <Text style={{ color: "white", fontSize: 22 }}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          disabled={currentIndex === pages.length - 1}
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 50,
          }}
        >
          <Text style={{ color: "white", fontSize: 22 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Hiển thị số trang */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          alignSelf: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: "white" }}>
          Page {currentIndex + 1} / {pages.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

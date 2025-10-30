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
} from "react-native";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { SwiperFlatList } from "react-native-swiper-flatlist";

const { width, height } = Dimensions.get("window");

export default function ReadBookScreen() {
  const params = useLocalSearchParams();

  const cleanBookUuid = (params.book_uuid ?? "").toString().trim();
  const cleanLanguageId = (params.bookLang ?? "").toString().trim();

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (!cleanBookUuid) {
      setLoading(false);
      return;
    }

    const fetchPages = async () => {
      let { data, error } = await supabase
        .from("book_content_page")
        .select("book_uuid, language_id, page, image, content_value")
        .eq("book_uuid", cleanBookUuid)
        .eq("language_id", cleanLanguageId)
        .order("page", { ascending: true });

      if (error) console.error("❌ Supabase error:", error);

      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from("book_content_page")
          .select("book_uuid, language_id, page, image, content_value")
          .eq("book_uuid", cleanBookUuid)
          .order("page", { ascending: true });
        data = fallbackData || [];
      }

      setPages(data || []);
      setLoading(false);
    };

    fetchPages();
  }, [cleanBookUuid, cleanLanguageId]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Slider */}
      <SwiperFlatList
        ref={swiperRef}
        showPagination
        paginationStyleItemInactive={{ opacity: 0.3 }}
        paginationStyleItemActive={{ opacity: 1 }}
        onChangeIndex={({ index }) => setCurrentIndex(index)}
      >
        {pages.map((page, index) => (
          <ScrollView
            key={index}
            style={{
              width,
              paddingHorizontal: 16,
              backgroundColor: "#fff",
            }}
            contentContainerStyle={{
              alignItems: "center",
              paddingBottom: 80,
            }}
          >
            {/* Ảnh trang */}
            {page.image ? (
              <Image
                source={{ uri: page.image }}
                style={{
                  width,
                  height: height * 0.6,
                  resizeMode: "contain",
                  marginTop: 10,
                }}
              />
            ) : (
              <Text>No image for page {page.page}</Text>
            )}

            {/* Hiển thị số trang */}
            
            {/* Hiển thị nội dung text */}
            {page.content_value ? (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 16,
                  lineHeight: 24,
                  color: "#333",
                  textAlign: "justify",
                }}
              >
                {page.content_value}
              </Text>
            ) : (
              <Text style={{ color: "#888", marginTop: 10 }}>
                (No text content)
              </Text>
            )}
            
          </ScrollView>
        ))}
      </SwiperFlatList>

      {/* Nút điều hướng trái/phải */}
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
        {/* Prev */}
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

        {/* Next */}
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

      {/* Số trang hiện tại / tổng số */}
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

// components/ReadBookScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { supabase } from "../lib/supabase";

export default function ReadBookScreen() {
  const { book_uuid, bookLang } = useLocalSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        if (!book_uuid || !bookLang) {
          setErrorMsg("Thiếu tham số book_uuid hoặc bookLang");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("book_content")
          .select("pdf_url")
          .eq("book_id", book_uuid)
          .eq("language_id", Number(bookLang))
          .maybeSingle();

        if (error) setErrorMsg("Không thể tải PDF từ máy chủ");
        else if (!data?.pdf_url) setErrorMsg("Không tìm thấy PDF cho sách này");
        else setPdfUrl(data.pdf_url);
      } catch {
        setErrorMsg("Lỗi khi tải sách");
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
  }, [book_uuid, bookLang]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f" />
        <Text style={styles.text}>Đang tải sách...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{errorMsg}</Text>
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Không tìm thấy PDF</Text>
      </View>
    );
  }

  // Web hiển thị trực tiếp bằng iframe
  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1 }}>
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
          }}
        />
      </View>
    );
  }

  // ✅ Mobile dùng PDF.js Viewer (không bị chặn)
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;

  return (
    <WebView
      source={{ uri: viewerUrl }}
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00f" />
          <Text style={styles.text}>Đang tải sách...</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
});

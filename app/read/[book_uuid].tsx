import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function ReadBookScreen() {
  const { book_uuid, language } = useLocalSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdf = async () => {
      if (!book_uuid || !language) return;
      try {
        const { data, error } = await supabase
          .from("book_content")
          .select("pdf_url")
          .eq("book_id", book_uuid)
          .eq("language_id", Number(language))
          .maybeSingle();

        if (error) throw error;
        if (!data?.pdf_url) {
          Alert.alert("Lỗi", "Không tìm thấy file PDF cho ngôn ngữ này.");
          return;
        }
        setPdfUrl(data.pdf_url);
      } catch (err) {
        console.error(err);
        Alert.alert("Lỗi", "Không thể tải file PDF.");
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
  }, [book_uuid, language]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );

  if (!pdfUrl)
    return (
      <View style={styles.center}>
        <Text>Không có PDF để hiển thị.</Text>
      </View>
    );

  return (
    <WebView
      source={{ uri: pdfUrl }}
      style={{ flex: 1 }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

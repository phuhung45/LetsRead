import React, { useEffect, useState } from "react";
import { Modal, View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  bookId: string;
  languageId: string;
  onClose: () => void;
}

export default function BookPdfViewer({ visible, bookId, languageId, onClose }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const fetchPdf = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("book_content")
          .select("pdf_url")
          .eq("book_id", bookId)
          .eq("language_id", Number(languageId))
          .maybeSingle();

        if (error) throw error;
        if (!data?.pdf_url) throw new Error("Không tìm thấy PDF");

        setPdfUrl(data.pdf_url);
      } catch (err) {
        console.error("fetchPdf error:", err);
        setPdfUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [visible, bookId, languageId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1 }} />
        ) : pdfUrl ? (
          <WebView
            source={{ uri: pdfUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => <ActivityIndicator size="large" color="#4CAF50" />}
          />
        ) : (
          <View style={styles.errorView}>
            <Text>Không tìm thấy file PDF.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  closeButton: {
    padding: 12,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  closeText: { fontSize: 16, fontWeight: "700" },
  errorView: { flex: 1, justifyContent: "center", alignItems: "center" },
});

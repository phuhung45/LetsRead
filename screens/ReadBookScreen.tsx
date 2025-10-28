import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../lib/supabase";
import { WebView } from "react-native-webview";
import { Picker } from "@react-native-picker/picker";
import * as Linking from "expo-linking";

export default function ReadBookScreen() {
  const { book_uuid, bookLang } = useLocalSearchParams();
  const webViewRef = useRef<any>(null);

  const [languagesList, setLanguagesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedLang, setSelectedLang] = useState<string | null>(bookLang?.toString() || null);
  const [bookTitle, setBookTitle] = useState<string>("Đang tải...");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // 🧩 Lấy danh sách ngôn ngữ
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from("books")
          .select("language_id, languages(name)")
          .eq("book_uuid", book_uuid);

        if (error) throw error;
        if (!data?.length) {
          setErrorMsg("Không tìm thấy ngôn ngữ nào cho sách này.");
          return;
        }

        const langs = data.map((r) => ({
          id: r.language_id,
          name: r.languages?.name || "Unknown",
        }));
        setLanguagesList(langs);
        if (!selectedLang) setSelectedLang(langs[0].id.toString());
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách ngôn ngữ:", err);
        setErrorMsg("Không thể tải danh sách ngôn ngữ.");
      }
    };

    fetchLanguages();
  }, [book_uuid]);

  // 🧩 Lấy dữ liệu PDF/EPUB
  useEffect(() => {
    if (!selectedLang) return;
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: titleData, error: titleError } = await supabase
          .from("books")
          .select("title")
          .eq("book_uuid", book_uuid)
          .eq("language_id", selectedLang)
          .maybeSingle();

        if (titleError) throw titleError;
        if (!titleData) {
          setErrorMsg("Không tìm thấy tiêu đề sách.");
          setLoading(false);
          return;
        }
        setBookTitle(titleData.title);

        const { data: content, error: contentError } = await supabase
          .from("book_content")
          .select("pdf_url, epub_url")
          .eq("book_id", book_uuid)
          .eq("language_id", selectedLang)
          .maybeSingle();

        if (contentError) throw contentError;
        if (!content?.pdf_url) {
          setErrorMsg("Không tìm thấy file PDF cho ngôn ngữ này.");
          setLoading(false);
          return;
        }

        setPdfUrl(content.pdf_url);
        setEpubUrl(content.epub_url);
      } catch (err) {
        console.error("❌ Lỗi khi load PDF:", err);
        setErrorMsg("Không thể tải sách này.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [selectedLang, book_uuid]);

  // ------------------ WebView HTML + Prev/Next ------------------
  const getPdfHtml = (pdfUrl: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body, iframe { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; }
        </style>
      </head>
      <body>
        <iframe id="pdfFrame" src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#toolbar=0" style="border:none;width:100%;height:100%"></iframe>
        <script>
          const iframe = document.getElementById('pdfFrame');

          function sendPageInfo() {
            try {
              const app = iframe.contentWindow.PDFViewerApplication;
              if (app?.pdfDocument) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'pageInfo',
                  page: app.page,
                  total: app.pdfDocument.numPages
                }));
              }
            } catch(e){}
          }

          iframe.onload = () => {
            try {
              const app = iframe.contentWindow.PDFViewerApplication;
              app.eventBus.on('pagechanging', sendPageInfo);
              app.eventBus.on('pagesloaded', sendPageInfo);
              sendPageInfo();
            } catch(e){}
          }

          window.addEventListener('message', function(event) {
            try {
              const msg = JSON.parse(event.data);
              const app = iframe.contentWindow.PDFViewerApplication;
              if (!app) return;
              if (msg.type === 'prev') { app.page--; sendPageInfo(); }
              if (msg.type === 'next') { app.page++; sendPageInfo(); }
            } catch(e){}
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "pageInfo") {
        setCurrentPage(msg.page);
        setTotalPages(msg.total);
      }
    } catch {}
  };

  const handleDownload = async (type: "pdf" | "epub") => {
    const url = type === "pdf" ? pdfUrl : epubUrl;
    if (!url) return alert(`Không có file ${type.toUpperCase()}`);
    await Linking.openURL(url);
    setShowDownloadPopup(false);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00f" />
        <Text style={styles.text}>Đang tải sách...</Text>
      </View>
    );

  if (errorMsg)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{errorMsg}</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{bookTitle}</Text>
        </View>

        <View style={styles.centerSection}>
          <Picker
            selectedValue={selectedLang}
            onValueChange={(v) => setSelectedLang(v)}
            style={styles.languagePicker}
            dropdownIconColor="#000"
          >
            {languagesList.map((lang) => (
              <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={() => setShowDownloadPopup(true)}
          style={styles.downloadBtn}
        >
          <Text style={styles.downloadText}>Download ⬇</Text>
        </TouchableOpacity>
      </View>

      {/* Render PDF */}
      {pdfUrl && Platform.OS !== "web" ? (
        <>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: getPdfHtml(pdfUrl) }}
            style={{ flex: 1 }}
            startInLoadingState
            onMessage={handleMessage}
          />

          {/* Prev/Next */}
          <View style={styles.pdfControls}>
            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => webViewRef.current?.postMessage(JSON.stringify({ type: 'prev' }))}
            >
              <Text style={styles.ctrlText}>← Prev</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>{currentPage}/{totalPages || "?"}</Text>

            <TouchableOpacity
              style={styles.ctrlBtn}
              onPress={() => webViewRef.current?.postMessage(JSON.stringify({ type: 'next' }))}
            >
              <Text style={styles.ctrlText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : Platform.OS === "web" && pdfUrl ? (
        <iframe
          src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#toolbar=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="PDF Viewer"
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>Không thể hiển thị PDF</Text>
        </View>
      )}

      {/* Popup Download */}
      <Modal
        visible={showDownloadPopup}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDownloadPopup(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDownloadPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Download Book</Text>

              <TouchableOpacity style={styles.modalBtn} onPress={() => handleDownload("pdf")}>
                <Text style={styles.modalBtnText}>📕 Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtn} onPress={() => handleDownload("epub")}>
                <Text style={styles.modalBtnText}>📘 Download EPUB</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowDownloadPopup(false)} style={[styles.modalBtn, styles.modalCancel]}>
                <Text style={[styles.modalBtnText, { color: "#999" }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#11813a",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  backText: { color: "#fff", fontSize: 22 },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    maxWidth: 150,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  languagePicker: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight:"90%",
    height: 36,
    color: "#000",
  },
  downloadBtn: {
    backgroundColor: "#0c5",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  downloadText: { fontSize: 20, color: "#fff" },

  pdfControls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  ctrlBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  ctrlText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  pageIndicator: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  text: { color: "#fff", marginTop: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 260,
    alignItems: "center",
  },
  modalTitle: { fontWeight: "700", fontSize: 18, marginBottom: 16 },
  modalBtn: {
    width: "100%",
    backgroundColor: "#11813a",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  modalCancel: { backgroundColor: "#eee" },
});

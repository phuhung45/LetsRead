import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";

interface Props {
  visible?: boolean;
  bookId: string | undefined;
  onClose: () => void;
}

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? "-"}</Text>
  </View>
);

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [languagesList, setLanguagesList] = useState<{ id: string; name: string }[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookCache, setBookCache] = useState<Record<string, any>>({});

  const fetchBookByLanguage = async (language_id: string) => {
    if (!bookId) return;

    if (bookCache[language_id]) {
      setBook(bookCache[language_id]);
      return;
    }

    setLoading(true);
    try {
      const [{ data: bookData }, { data: catRel }] = await Promise.all([
        supabase
          .from("books")
          .select("*")
          .eq("book_uuid", bookId)
          .eq("language_id", language_id)
          .maybeSingle(),
        supabase.from("book_categories").select("category_id").eq("book_id", bookId),
      ]);

      if (!bookData) {
        setBook(null);
        return;
      }

      const catIds = catRel?.map((c: any) => c.category_id) ?? [];
      let categories: string[] = [];

      if (catIds.length > 0) {
        const { data: catNames } = await supabase
          .from("categories")
          .select("name")
          .in("id", catIds);
        categories = catNames?.map((c: any) => c.name) ?? [];
      }

      const bookResult = { ...bookData, categories };
      setBook(bookResult);
      setBookCache((prev) => ({ ...prev, [language_id]: bookResult }));
    } catch {
      Alert.alert("Lỗi", "Không thể tải dữ liệu sách.");
    } finally {
      setLoading(false);
    }
  };

  /* Load languages */
  useEffect(() => {
    if (!visible || !bookId) {
      setBook(null);
      setLanguagesList([]);
      setSelectedLanguage(null);
      setBookCache({});
      setIsFavorite(false);
      return;
    }

    const fetchLanguages = async () => {
      setLoading(true);
      try {
        const { data: langRecords } = await supabase
          .from("books")
          .select("language_id, languages(name)")
          .eq("book_uuid", bookId);

        const list =
          langRecords?.map((r: any) => ({
            id: r.language_id,
            name: r.languages?.name || "Unknown",
          })) ?? [];

        setLanguagesList(list);

        const defaultLang = list[0]?.id;
        if (defaultLang) {
          setSelectedLanguage(defaultLang);
          await fetchBookByLanguage(defaultLang);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [visible, bookId]);

  useEffect(() => {
    if (visible && selectedLanguage) {
      fetchBookByLanguage(selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleIOSLanguageSelect = () => {
    const options = languagesList.map((l) => l.name);
    const ids = languagesList.map((l) => l.id);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...options, "Cancel"],
        cancelButtonIndex: options.length,
      },
      (index) => {
        if (index < ids.length) {
          setSelectedLanguage(ids[index]);
        }
      }
    );
  };

  /* Favorite */
  useEffect(() => {
    const checkFavorite = async () => {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      if (!userId || !bookId) return;

      const { data } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", userId)
        .maybeSingle();

      setIsFavorite(!!data);
    };

    if (visible) checkFavorite();
  }, [visible]);

  const handleAddFavorite = async () => {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;

    if (!userId) {
      Alert.alert("Notice", "You need login");
      return;
    }

    if (!bookId) return;

    try {
      if (isFavorite) {
        await supabase
          .from("user_favorites")
          .delete()
          .eq("book_id", bookId)
          .eq("user_id", userId);

        setIsFavorite(false);
      } else {
        await supabase.from("user_favorites").insert([
          { user_id: userId, book_id: bookId, created_at: new Date().toISOString() },
        ]);
        setIsFavorite(true);
      }
    } catch {
      Alert.alert("Error", "Can not update your favorite.");
    }
  };

  const handleRead = () => {
    if (!book || !selectedLanguage) return;

    onClose();
    setTimeout(() => {
      router.push({
        pathname: `/read/${book.book_uuid}`,
        params: { bookLang: selectedLanguage },
      });
    }, 200);
  };

  const openSafeUrl = async (url: string) => {
    const safe = encodeURI(url).replace(/\+/g, "%2B");
    await WebBrowser.openBrowserAsync(safe);
  };

  const handleDownload = async () => {
    if (!book || !selectedLanguage) return;

    const { data } = await supabase
      .from("book_content")
      .select("pdf_url, epub_url")
      .eq("book_id", book.book_uuid)
      .eq("language_id", selectedLanguage)
      .maybeSingle();

    if (data?.pdf_url) return openSafeUrl(data.pdf_url);
    if (data?.epub_url) return openSafeUrl(data.epub_url);

    Alert.alert("Không có file để tải");
  };

  if (!visible) return null;

  const displayBook = book || {};

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.popupContainer}>
          {/* close */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingView}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading book data...</Text>
            </View>
          ) : !book ? (
            <View style={styles.errorView}>
              <View style={styles.placeholderImage} />
              <Text style={styles.errorText}>Can not find this book.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {/* cover */}
              <View style={styles.coverWrap}>
                <Image source={{ uri: displayBook.cover_image }} style={styles.coverImage} />
              </View>

              {/* title */}
              <Text style={styles.title}>{displayBook.title}</Text>
              <Text style={styles.author}>{displayBook.author}</Text>

              {/* ✅ LANGUAGE SELECT FIX */}
              <View style={styles.langRow}>
                {Platform.OS === "ios" ? (
                  <TouchableOpacity onPress={handleIOSLanguageSelect} style={styles.pickerWrapper}>
                    <Text style={styles.languagePicker}>
                      {languagesList.find((l) => String(l.id) === String(selectedLanguage))?.name ||
                        "Select Language"}
                    </Text>

                  </TouchableOpacity>
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedLanguage}
                      onValueChange={(v) => setSelectedLanguage(v)}
                      style={styles.languagePicker}
                    >
                      {languagesList.map((lang) => (
                        <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
                      ))}
                    </Picker>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.favoriteButton,
                    { backgroundColor: isFavorite ? "#11813a" : "#f5f5f5" },
                  ]}
                  onPress={handleAddFavorite}
                >
                  <Text
                    style={[
                      styles.favoriteButtonText,
                      { color: isFavorite ? "#11813a" : "#888" },
                    ]}
                  >
                    ❤️
                  </Text>
                </TouchableOpacity>
              </View>

              {/* READ + DOWNLOAD */}
              <View style={styles.readDownloadRow}>
                <TouchableOpacity style={styles.readButton} onPress={handleRead}>
                  <Text style={styles.readButtonText}>📖 Read</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                  <Text style={styles.downloadButtonText}>⬇</Text>
                </TouchableOpacity>
              </View>

              {/* description */}
              <Text style={styles.bookDescription}>
                {displayBook.description || "Không có mô tả."}
              </Text>

              {/* STATS */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Reading Level</Text>
                  <Text style={styles.statValue}>{displayBook.reading_level || "-"}</Text>
                </View>

                <View style={[styles.statBox, styles.statBoxBorder]}>
                  <Text style={styles.statLabel}>Pages</Text>
                  <Text style={styles.statValue}>{displayBook.pages || "-"}</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Languages</Text>
                  <Text style={styles.statValue}>{languagesList?.length || "-"}</Text>
                </View>
              </View>

              {/* DETAILS */}
              <View style={styles.detailsContainer}>
                <View style={styles.hr} />
                <InfoItem label="Publisher" value={displayBook.publisher} />
                <View style={styles.hr} />
                <InfoItem label="Illustrator" value={displayBook.illustrator} />
                <View style={styles.hr} />
                <InfoItem label="Categories" value={displayBook.categories?.join(", ")} />
                <View style={styles.hr} />
                <InfoItem label="Country" value={displayBook.country_of_origin} />
                <View style={styles.hr} />
                <InfoItem label="Source Language" value={displayBook.source_language} />
                <View style={styles.hr} />
                <InfoItem label="Status" value={displayBook.status ?? "Complete"} />
                <View style={styles.hr} />
                <InfoItem label="Notes" value={displayBook.notes} />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxWidth: 900,
    maxHeight: "100%",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 20,
    padding: 6,
  },
  closeButtonText: { fontSize: 20, color: "#333" },
  loadingView: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#555" },
  errorView: { padding: 30, alignItems: "center", width: "100%" },
  placeholderImage: {
    width: 150,
    height: 220,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
  },
  scrollViewContent: {
    paddingHorizontal: "10%",
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  coverWrap: {
    width: 160,
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
    marginBottom: 12,
  },
  coverImage: { width: "100%", height: "100%" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 6 },
  author: { textAlign: "center", color: "#1e88e5", marginBottom: 12 },

  /* ✅ FIX iOS Picker */
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    backgroundColor: "#fafafa",
    paddingLeft: 12,
  },
  languagePicker: {
    fontSize: 14,
    color: "#333",
  },

  favoriteButton: {
    width: 60,
    height: 48,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  favoriteButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },

  readDownloadRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  readButton: {
    flex: 1,
    backgroundColor: "#11813a",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  readButtonText: { color: "#fff", fontWeight: "700" },

  downloadButton: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    height: 48,
    marginLeft: 6,
  },

  downloadButtonText: { color: "#333", fontSize: 18 },

  bookDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 18,
    width: "100%",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 16,
    width: "100%",
    marginBottom: 20,
  },

  statBox: { flex: 1, alignItems: "center" },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ddd",
  },

  statLabel: { fontSize: 12, color: "#777", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#111" },

  detailsContainer: { width: "100%", paddingVertical: 8 },
  hr: { height: 1, backgroundColor: "#eee", marginVertical: 12 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 12, color: "#777" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "600" },
});

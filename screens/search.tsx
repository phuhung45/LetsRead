import { useLocalSearchParams, router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import SearchBarWithFilter from "../components/SearchBarWithFilter";
import BookDetailPopup from "../components/BookDetailPopup";

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const initialCategoryId = params.category_id as string | undefined;
  const initialCategoryName = params.category_name as string | undefined;

  const [searchText, setSearchText] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBook, setSelectedBook] = useState<any>(null);

  const screenWidth = Dimensions.get("screen").width;
  const numColumns = screenWidth < 600 ? 2 : screenWidth < 900 ? 3 : 4;
  const bookWidth = (screenWidth - (numColumns + 1) * 12) / numColumns;

  // ✅ Fetch dữ liệu
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);

      const query = supabase
        .from("books")
        .select("book_uuid, title, cover_image, author");

      if (initialCategoryId) {
        query.eq("category_id", initialCategoryId);
      }

      const { data } = await query;
      setBooks(data || []);
      setLoading(false);
    };

    loadBooks();
  }, [initialCategoryId]);

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={{ fontSize: 18 }}>← Back</Text>
      </TouchableOpacity>

      {/* ✅ Title */}
      <Text style={styles.title}>
        {initialCategoryName ? `Danh mục: ${initialCategoryName}` : "Tìm kiếm"}
      </Text>

      <SearchBarWithFilter
        value={searchText}
        onChangeText={setSearchText}
        onOpenFilter={() => {}}
      />

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View style={styles.grid}>
          {filteredBooks.map((b) => (
            <TouchableOpacity
              key={b.book_uuid}
              style={[styles.bookItem, { width: bookWidth }]}
              onPress={() => setSelectedBook(b)}
            >
              <Image
                source={{ uri: b.cover_image }}
                style={styles.bookImage}
              />
              <Text numberOfLines={1} style={styles.bookTitle}>
                {b.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ✅ Popup chi tiết */}
      <BookDetailPopup
        visible={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        bookId={selectedBook?.book_uuid}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, backgroundColor: "#fff" },
  backBtn: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", paddingHorizontal: 16, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  bookItem: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8 },
  bookImage: { width: "100%", height: 180, borderRadius: 6 },
  bookTitle: { marginTop: 6, fontSize: 15, fontWeight: "600" },
});

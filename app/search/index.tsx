import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";

import SearchBarWithFilter from "../../components/SearchBarWithFilter";
import BookDetailPopup from "../../components/BookDetailPopup";
import FilterPopup from "../../components/FilterPopup";

export default function SearchScreen() {
  // ✅ Params
  const params = useLocalSearchParams();
  const categoryId = params.category_id as string | undefined;
  const categoryName = params.category_name as string | undefined;

  // ✅ States
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  // ✅ Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilterCats, setSelectedFilterCats] = useState<string[]>([]);

  // ✅ Responsive
  const screenWidth = Dimensions.get("screen").width;
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 1024;

  const CARD_WIDTH = isMobile
    ? (screenWidth * 0.9 - 12) / 2 // 2 books / row
    : isTablet
    ? 200 // 4 books / row
    : 233; // 6 books / row

  const IMAGE_HEIGHT = 300;

  // ✅ Load categories for FilterPopup
  useEffect(() => {
    const loadCats = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      setCategories(data || []);
    };
    loadCats();
  }, []);

  // ✅ Load books by category_id passed from CategoryList
  useEffect(() => {
    const fetchBooks = async () => {
      if (!categoryId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("books")
        .select(`
          book_uuid,
          title,
          cover_image,
          author,
          book_categories ( category_id )
        `);

      if (error) {
        console.log("FETCH ERROR:", error);
        setLoading(false);
        return;
      }

      // ✅ Filter books that belong to this category
      const filtered = (data || []).filter((b) =>
        b.book_categories?.some(
          (c: any) => String(c.category_id) === String(categoryId)
        )
      );

      setBooks(filtered);
      setLoading(false);
    };

    fetchBooks();
  }, [categoryId]);

  // ✅ Combine filter logic: search + multiple categories
  const filteredBooks = books.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(searchText.toLowerCase());

    if (selectedFilterCats.length === 0) {
      return matchSearch;
    }

    const matchCategory = b.book_categories?.some((c: any) =>
      selectedFilterCats.includes(String(c.category_id))
    );

    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{categoryName || "Search"}</Text>

        <View style={{ width: 30 }} />
      </View>

      {/* ✅ Search bar */}
      <View style={{ paddingHorizontal: "5%", marginBottom: 12 }}>
        <SearchBarWithFilter
          value={searchText}
          onChangeText={setSearchText}
          onOpenFilter={() => setFilterVisible(true)}
        />
      </View>

      {/* ✅ Loading state */}
      {loading ? (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: "5%",
            paddingBottom: 100,
          }}
        >
          <View style={styles.grid}>
            {filteredBooks.map((b) => (
              <TouchableOpacity
                key={b.book_uuid}
                style={[styles.bookCard, { width: CARD_WIDTH }]}
                onPress={() => setSelectedBook(b)}
              >
                <Image
                  source={{ uri: b.cover_image }}
                  style={[
                    styles.bookImage,
                    { height: IMAGE_HEIGHT },
                  ]}
                />

                <Text numberOfLines={1} style={styles.bookTitle}>
                  {b.title}
                </Text>
              </TouchableOpacity>
            ))}

            {!filteredBooks.length && (
              <Text style={styles.noData}>Không có sách phù hợp.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* ✅ Detail popup */}
      <BookDetailPopup
        visible={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        bookId={selectedBook?.book_uuid}
      />

      {/* ✅ Filter popup */}
      <FilterPopup
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={categories}
        selectedCategories={selectedFilterCats}
        setSelectedCategories={setSelectedFilterCats}
        onClear={() => setSelectedFilterCats([])}
        onApply={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "5%",
    paddingVertical: 12,
    justifyContent: "space-between",
  },

  backIcon: { fontSize: 26, fontWeight: "600" },

  pageTitle: { fontSize: 20, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },

  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  bookImage: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#eee",
  },

  bookTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
  },

  noData: {
    marginTop: 40,
    fontSize: 16,
    textAlign: "center",
    width: "100%",
  },
});

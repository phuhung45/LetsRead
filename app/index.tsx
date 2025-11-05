import { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

// ✅ Components gốc
import HeaderMobile from "../components/HeaderMobile";
import HeaderDesktop from "../components/HeaderDesktop";
import FooterMobile from "../components/FooterMobile";
import FooterDesktop from "../components/FooterDesktop";
import ImageSlider from "../components/ImageSlider";
import CategoryList from "../components/CategoryList";
import AppIntro from "../components/AppIntro";
import BookDetailPopup from "../components/BookDetailPopup";

// ✅ NEW
import SearchBarWithFilter from "../components/SearchBarWithFilter";
import FilterPopup from "../components/FilterPopup";

// 📱 Hook kiểm tra thiết bị
const useIsMobile = () => {
  const getIsMobile = () => Dimensions.get("screen").width < 900;
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useLayoutEffect(() => {
    const update = ({ screen }: { screen: any }) => {
      setIsMobile(screen.width < 900);
    };
    const sub = Dimensions.addEventListener("change", update);
    return () => sub?.remove?.();
  }, []);

  return isMobile;
};

// 🔢 Số cột theo độ rộng
const useNumColumns = () => {
  const [numColumns, setNumColumns] = useState(() => {
    const width = Dimensions.get("screen").width;
    if (width < 600) return 2;
    if (width < 900) return 3;
    if (width < 1200) return 4;
    return 6;
  });

  useEffect(() => {
    const updateColumns = ({ screen }: { screen: any }) => {
      const width = screen.width;
      if (width < 600) setNumColumns(2);
      else if (width < 900) setNumColumns(3);
      else if (width < 1200) setNumColumns(4);
      else setNumColumns(6);
    };
    const sub = Dimensions.addEventListener("change", updateColumns);
    return () => sub?.remove?.();
  }, []);

  return numColumns;
};

// 📏 Chiều cao ảnh responsive
const useResponsiveImageHeight = () => {
  const [height, setHeight] = useState(() => {
    const width = Dimensions.get("screen").width;
    if (width < 600) return 180;
    if (width < 900) return 220;
    if (width < 1200) return 260;
    return 350;
  });

  useEffect(() => {
    const updateHeight = ({ screen }: { screen: any }) => {
      const width = screen.width;
      if (width < 600) setHeight(180);
      else if (width < 900) setHeight(220);
      else if (width < 1200) setHeight(260);
      else setHeight(350);
    };
    const sub = Dimensions.addEventListener("change", updateHeight);
    return () => sub?.remove?.();
  }, []);

  return height;
};

// 🧱 Danh sách sách trong từng danh mục
const BookListByCategory = ({
  books,
  categoryName,
  onSelectBook,
}: {
  books: any[];
  categoryName: string;
  onSelectBook: (book: any) => void;
}) => {
  const [page, setPage] = useState(0);
  const numColumns = useNumColumns();
  const imageHeight = useResponsiveImageHeight();

  const pageSize = numColumns;
  const totalPages = Math.ceil(books.length / pageSize);
  const pagedBooks = books.slice(page * pageSize, (page + 1) * pageSize);

  const windowWidth = Dimensions.get("screen").width * 0.9;
  const bookWidth = (windowWidth - (numColumns - 1) * 8) / numColumns;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {totalPages > 1 && (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              disabled={page === 0}
              onPress={() => setPage(page - 1)}
              style={[styles.pageButton, page === 0 && styles.disabledButton]}
            >
              <Text>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={page === totalPages - 1}
              onPress={() => setPage(page + 1)}
              style={[
                styles.pageButton,
                page === totalPages - 1 && styles.disabledButton,
                { marginLeft: 8 },
              ]}
            >
              <Text>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {pagedBooks.map((b) => (
          <TouchableOpacity
            key={b.book_uuid}
            onPress={() => onSelectBook(b)}
            style={{ width: bookWidth, padding: 4 }}
          >
            <View style={styles.bookCard}>
              <Image
                source={{
                  uri: b.cover_image || "https://via.placeholder.com/100x150",
                }}
                style={{
                  width: "100%",
                  height: imageHeight,
                  borderRadius: 8,
                }}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={styles.bookTitle}>
                {b.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 🌍 Component chính
export default function Index() {
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<any[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<Record<string, any[]>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [languageId] = useState("4846240843956224");

  const [selectedBook, setSelectedBook] = useState<any>(null);

  // ✅ Filter category từ CategoryList
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // ✅ NEW — SEARCH
  const [searchText, setSearchText] = useState("");

  // ✅ NEW — FILTER POPUP
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilterCats, setSelectedFilterCats] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      const { data: booksData } = await supabase
        .from("books")
        .select("book_uuid, title, cover_image, author, language_id")
        .eq("language_id", languageId);

      const { data: bcData } = await supabase
        .from("book_categories")
        .select("book_id, category_id");

      const grouped: Record<string, any[]> = {};
      for (const bc of bcData || []) {
        const book = booksData?.find(
          (b) => String(b.book_uuid) === String(bc.book_id)
        );
        if (!book) continue;
        if (!grouped[bc.category_id]) grouped[bc.category_id] = [];
        grouped[bc.category_id].push(book);
      }

      const filtered = (categoriesData || []).filter(
        (c) => grouped[c.id]?.length > 0
      );

      setCategories(filtered);
      setBooksByCategory(grouped);
      setLoading(false);
    };
    fetchData();
  }, [languageId]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#999" />
      </SafeAreaView>
    );
  }

  // ✅ FILTER CATEGORY FINAL LOGIC
  const categoryListToShow = selectedFilterCats.length
    ? categories.filter((c) => selectedFilterCats.includes(c.id))
    : selectedCategoryId
    ? categories.filter((c) => c.id === selectedCategoryId)
    : categories;

  return (
    <SafeAreaView style={styles.container}>
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 16,
            paddingHorizontal: "5%",
            paddingBottom: isMobile ? 100 : 40,
          }}
        >
          <View style={{ marginHorizontal: "-5%" }}>
            <ImageSlider />
          </View>

          {/* ✅ NEW Search + Filter */}
          <SearchBarWithFilter
            value={searchText}
            onChangeText={setSearchText}
            onOpenFilter={() => setFilterVisible(true)}
          />

          {/* ✅ Render CategoryList + FILTER COMBINED */}
          {categoryListToShow.map((cat) => (
            <BookListByCategory
              key={cat.id}
              books={(booksByCategory[cat.id] || []).filter((b) =>
                b.title.toLowerCase().includes(searchText.toLowerCase())
              )}
              categoryName={cat.name}
              onSelectBook={(book) => setSelectedBook(book)}
            />
          ))}

          {/* ✅ CategoryList cũ */}
          <CategoryList
            onSelectCategory={(cat) => setSelectedCategoryId(cat.id)}
          />

          {!isMobile && <AppIntro />}
          {!isMobile && <FooterDesktop />}
        </ScrollView>

        {isMobile && (
          <View style={styles.footerMobileWrapper}>
            <FooterMobile />
          </View>
        )}
      </View>

      {/* ✅ POPUP DETAILS */}
      <BookDetailPopup
        visible={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        bookId={selectedBook?.book_uuid}
      />

      {/* ✅ POPUP FILTER */}
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
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: { fontSize: 20, fontWeight: "bold" },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  disabledButton: { backgroundColor: "#eee" },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  bookTitle: { marginTop: 4, fontSize: 16, fontWeight: "600" },
  footerMobileWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    zIndex: 10,
  },
});

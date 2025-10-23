import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { supabase } from "../lib/supabase";
import HeaderMobile from "../components/HeaderMobile";
import HeaderDesktop from "../components/HeaderDesktop";
import FooterDesktop from "../components/FooterDesktop";
import ImageSlider from "../components/ImageSlider";
import CategoryList from "../components/CategoryList";
import AppIntro from "../components/AppIntro";

const useNumColumns = () => {
  const [numColumns, setNumColumns] = useState(() => {
    const width = Dimensions.get("window").width;
    if (width < 600) return 2;
    if (width < 900) return 3;
    if (width < 1200) return 4;
    return 6;
  });

  useEffect(() => {
    const updateColumns = ({ window }: { window: any }) => {
      const width = window.width;
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

const useResponsiveImageHeight = () => {
  const [height, setHeight] = useState(() => {
    const width = Dimensions.get("window").width;
    if (width < 600) return 180;
    if (width < 900) return 220;
    if (width < 1200) return 260;
    return 350;
  });

  useEffect(() => {
    const updateHeight = ({ window }: { window: any }) => {
      const width = window.width;
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(Dimensions.get("window").width < 900);
  useEffect(() => {
    const update = ({ window }: { window: any }) =>
      setIsMobile(window.width < 900);
    const sub = Dimensions.addEventListener("change", update);
    return () => sub?.remove?.();
  }, []);
  return isMobile;
};

const BookListByCategory = ({
  books,
  categoryName,
}: {
  books: any[];
  categoryName: string;
}) => {
  const [page, setPage] = useState(0);
  const numColumns = useNumColumns();
  const imageHeight = useResponsiveImageHeight();

  const pageSize = numColumns;
  const totalPages = Math.ceil(books.length / pageSize);
  const pagedBooks = books.slice(page * pageSize, (page + 1) * pageSize);

  const windowWidth = Dimensions.get("window").width * 0.9;
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
          <View key={b.book_uuid} style={{ width: bookWidth, padding: 4 }}>
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
          </View>
        ))}
      </View>
    </View>
  );
};

export default function Index() {
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<any[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<Record<string, any[]>>({});
  const [languageId] = useState("4846240843956224");

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

      const filteredCategories = (categoriesData || []).filter(
        (c) => grouped[c.id]?.length > 0
      );

      setCategories(filteredCategories);
      setBooksByCategory(grouped);
    };
    fetchData();
  }, [languageId]);

  return (
    <View style={styles.container}>
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={{ marginHorizontal: "-5%" }}>
          <ImageSlider />
        </View>
        {categories.map((cat) => (
          <BookListByCategory
            key={cat.id}
            books={booksByCategory[cat.id] || []}
            categoryName={cat.name}
          />
        ))}
        <CategoryList
          onSelectCategory={(cat: { id: string; name: string; icon: string }) =>
            console.log("Selected:", cat.name)
          }
        />
        <AppIntro />
        <FooterDesktop />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContainer: {
    paddingVertical: 16,
    paddingHorizontal: "5%",
  },
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
});

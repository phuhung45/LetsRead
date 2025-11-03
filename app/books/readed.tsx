import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";

// Import header & footer
import HeaderMobile from "../../components/HeaderMobile";
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";
import FooterDesktop from "../../components/FooterDesktop";

// ✅ Import popup
import BookDetailPopup from "../../components/BookDetailPopup";

export default function ReadedBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_reads")
      .select("*, books(*)")
      .eq("progress", 1)
      .order("updated_at", { ascending: false });
    if (error) console.error(error);
    else setBooks(data || []);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  // ✅ Hiển thị số cột linh hoạt
  const numColumns = isMobile ? 3 : width < 1024 ? 4 : 6;

  return (
    <View style={styles.container}>
      {/* Header */}
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      {/* Nội dung chính */}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <FlatList
          scrollEnabled={false}
          contentContainerStyle={
            isMobile ? styles.gridMobile : styles.gridDesktop
          }
          numColumns={numColumns}
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedBookId(item.books?.id);
                setPopupVisible(true);
              }}
              activeOpacity={0.7}
              style={styles.card}
            >
              <Image
                source={{ uri: item.books?.cover_image }}
                style={[
                  styles.cover,
                  !isMobile && { width: 200, height: 290 }, // ✅ Web to hơn
                ]}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={styles.title}>
                {item.books?.title}
              </Text>
              <Text style={{ color: "green", fontSize: 12 }}>✅ Done</Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>

      {/* Footer */}
      {isMobile ? <FooterMobile /> : <FooterDesktop />}

      {/* ✅ Popup chi tiết sách */}
      <BookDetailPopup
        visible={popupVisible}
        bookId={selectedBookId}
        onClose={() => setPopupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // ✅ Mobile
  gridMobile: {
    padding: 12,
    justifyContent: "center",
    gap: 10,
  },

  // ✅ Web: padding 2 bên 15%, khoảng cách giữa các sách 50px
  gridDesktop: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: "15%",
    justifyContent: "center",
    columnGap: 50,
    rowGap: 50,
  },

  card: {
    flex: 1,
    alignItems: "center",
    marginVertical: 10,
  },
  cover: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },
  title: {
    marginTop: 6,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 13,
    width: 100,
  },
});

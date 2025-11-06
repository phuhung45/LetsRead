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
  Platform,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
import * as Progress from "react-native-progress";

import HeaderMobile from "../../components/HeaderMobile";
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";
import FooterDesktop from "../../components/FooterDesktop";
import BookDetailPopup from "../../components/BookDetailPopup"; // ✅ thêm dòng này
import { router } from "expo-router";

export default function AllBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null); // ✅ book đang chọn
  const [popupVisible, setPopupVisible] = useState(false); // ✅ popup hiển thị

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobile = !isWeb;

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    // ✅ Lấy session
    const { data: { session } } = await supabase.auth.getSession();

    // ✅ Nếu không có session → chuyển sang profile
    if (!session) {
      router.replace("/profile");
      return;
    }

    // ✅ Nếu có session → load sách
    loadBooks();
  }


  async function loadBooks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_reads")
      .select("*, books(*)")
      .order("updated_at", { ascending: false });

    if (error) console.error(error);
    else setBooks(data || []);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const numColumns = isMobile ? 3 : width < 1024 ? 4 : 6;

  const getGridStyle = () => {
    if (isWeb) {
      return {
        paddingHorizontal: width * 0.15,
        justifyContent: "center" as const,
        paddingBottom: 80,
        paddingTop: 20,
      };
    } else {
      return {
        paddingHorizontal: 12,
        justifyContent: "center" as const,
      };
    }
  };

  const getCoverStyle = () => {
    if (isWeb) {
      return {
        width: 200,
        height: 290,
        borderRadius: 8,
      };
    } else {
      return {
        width: 100,
        height: 140,
        borderRadius: 8,
      };
    }
  };

  const cardMargin = isWeb ? 25 : 5;

  const handlePressBook = (book: any) => {
    setSelectedBook(book);
    setPopupVisible(true);
  };

  return (
    <View style={styles.container}>
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <FlatList
          scrollEnabled={false}
          numColumns={numColumns}
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={getGridStyle()}
          columnWrapperStyle={{
            justifyContent: "center",
            marginBottom: isWeb ? 50 : 10,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handlePressBook(item)}
              activeOpacity={0.8}
              style={[styles.card, { marginHorizontal: cardMargin }]}
            >
              <Image
                source={{ uri: item.books?.cover_image }}
                style={getCoverStyle()}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={styles.title}>
                {item.books?.title}
              </Text>
              {item.progress < 1 ? (
                <View style={{ alignItems: "center", marginTop: 4 }}>
                  <Progress.Bar
                    progress={item.progress}
                    color="#4B7BE5"
                    width={80}
                  />
                  <Text style={{ fontSize: 12, color: "gray", marginTop: 2 }}>
                    {Math.round(item.progress * 100)}%
                  </Text>
                </View>
              ) : (
                <Text style={{ color: "green", fontSize: 12, marginTop: 4 }}>
                  ✅ Done
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </ScrollView>

      {isMobile ? <FooterMobile /> : <FooterDesktop />}

      {/* ✅ Popup chi tiết sách */}
      {selectedBook && (
        <BookDetailPopup
          visible={popupVisible}
          bookId={selectedBook.books?.id}
          onClose={() => setPopupVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    marginTop: 6,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 13,
    width: 100,
  },
});

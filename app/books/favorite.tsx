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
} from "react-native";
import { supabase } from "../../lib/supabase";

// ✅ Import header & footer
import HeaderMobile from "../../components/HeaderMobile";
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";
import FooterDesktop from "../../components/FooterDesktop";

export default function FavoriteBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_favorites")
      .select("*, books(*)")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setBooks(data || []);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const numColumns = isMobile ? 3 : width < 1024 ? 4 : 6;

  return (
    <View style={styles.container}>
      {/* ✅ Header */}
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

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
            <View style={styles.card}>
              <Image
                source={{ uri: item.books?.cover_image }}
                style={[
                  styles.cover,
                  !isMobile && { width: 200, height: 290 },
                ]}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={styles.title}>
                {item.books?.title}
              </Text>
              <Text style={{ color: "red", fontSize: 12 }}>❤️ Favorite</Text>
            </View>
          )}
        />
      </ScrollView>

      {/* ✅ Footer */}
      {isMobile ? <FooterMobile /> : <FooterDesktop />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Mobile layout
  gridMobile: {
    padding: 12,
    justifyContent: "center",
    gap: 10,
  },

  // Desktop layout
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

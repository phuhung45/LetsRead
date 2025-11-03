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
import * as Progress from "react-native-progress";

// Import header & footer
import HeaderMobile from "../../components/HeaderMobile";
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";
import FooterDesktop from "../../components/FooterDesktop";

export default function AllBooks() {
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
      .from("user_reads")
      .select("*, books(*)")
      .order("updated_at", { ascending: false });
    if (error) console.error(error);
    else setBooks(data || []);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const numColumns = isMobile ? 2 : width < 1024 ? 3 : 6;

  return (
    <View style={styles.container}>
      {/* Header */}
      {isMobile ? <HeaderMobile /> : <HeaderDesktop />}

      {/* Main content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <FlatList
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          numColumns={numColumns}
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.books?.cover_image }}
                style={styles.cover}
                resizeMode="cover"
              />
              <Text numberOfLines={1} style={styles.title}>
                {item.books?.title}
              </Text>
              {item.progress < 1 ? (
                <Progress.Bar
                  progress={item.progress}
                  color="#4B7BE5"
                  width={80}
                  style={{ marginTop: 4 }}
                />
              ) : (
                <Text style={{ color: "green", fontSize: 12, marginTop: 4 }}>
                  ✅ Đã đọc
                </Text>
              )}
            </View>
          )}
        />
      </ScrollView>

      {/* Footer */}
      {isMobile ? <FooterMobile /> : <FooterDesktop />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  grid: {
    padding: 12,
    justifyContent: "center",
    gap: 10,
  },
  card: {
    flex: 1 / 3,
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
    fontSize: 14,
    width: 100,
  },
});

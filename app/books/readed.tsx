import { useEffect, useState } from "react";
import { View, Text, Image, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ReadedBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <FlatList
      contentContainerStyle={styles.grid}
      numColumns={3}
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
          <Text style={{ color: "green", fontSize: 12 }}>Finished</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: 12, gap: 10 },
  card: { width: "30%", margin: 5, alignItems: "center" },
  cover: { width: 100, height: 140, borderRadius: 8 },
  title: { marginTop: 6, fontWeight: "bold", textAlign: "center", fontSize: 14 },
});

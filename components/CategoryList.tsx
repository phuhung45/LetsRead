import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function CategoryList() {
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<any[]>([]);

  let numColumns = width < 600 ? 2 : width < 1024 ? 3 : 5;
  let cardSize = width < 600 ? 100 : width < 1024 ? 140 : 150;
  let iconSize = width < 600 ? 50 : width < 1024 ? 55 : 100;

  // ✅ load categories thật từ DB
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon_url")
        .order("name");

      setCategories(data || []);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Books by Category</Text>

      <FlatList
        key={numColumns}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        data={categories}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: width * 0.1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { width: cardSize, height: cardSize }]}
            onPress={() =>
              router.push({
                pathname: "/search",
                params: {
                  category_id: item.id,
                  category_name: item.name,
                },
              })
            }
          >
            <Image
              source={{ uri: item.icon_url }}
              resizeMode="contain"
              style={{ width: iconSize, height: iconSize }}
            />
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 40, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 25, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  name: {
    marginTop: 8,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    color: "#000",
  },
});

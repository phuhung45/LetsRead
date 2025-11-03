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
} from "react-native";
import { supabase } from "../../lib/supabase";
import * as Progress from "react-native-progress";

import HeaderMobile from "../../components/HeaderMobile";
import HeaderDesktop from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";
import FooterDesktop from "../../components/FooterDesktop";

export default function AllBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobile = !isWeb;

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

  const numColumns = isMobile ? 3 : width < 1024 ? 4 : 6;

  // ✅ Sử dụng padding theo phần trăm bằng width thực tế
  const getGridStyle = () => {
    if (isWeb) {
      return {
        paddingHorizontal: width * 0.15, // tương đương 15%
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

  // ✅ Xử lý khoảng cách giữa các thẻ bằng columnWrapperStyle và margin
  const cardMargin = isWeb ? 25 : 5;

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
            marginBottom: isWeb ? 50 : 10, // gap giữa hàng
          }}
          renderItem={({ item }) => (
            <View style={[styles.card, { marginHorizontal: cardMargin }]}>
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
            </View>
          )}
        />
      </ScrollView>

      {isMobile ? <FooterMobile /> : <FooterDesktop />}
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

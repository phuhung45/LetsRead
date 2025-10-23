import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

export default function CategoryList({ onSelectCategory }: { onSelectCategory?: (c: any) => void }) {
  const { width } = useWindowDimensions();

  // Xác định loại thiết bị
  let numColumns = 5;
  let cardSize = 100;
  let iconSize = 60;

  if (width < 600) {
    // Mobile
    numColumns = 2;
    cardSize =100;
    iconSize = 50;
  } else if (width < 1024) {
    // Tablet
    numColumns = 3;
    cardSize = 140;
    iconSize = 55;
  } else {
    // Desktop
    numColumns = 5;
    cardSize = 150;
    iconSize = 100;
  }

const items = [
  { id: "mighty", name: "Mighty Girls", icon: "https://storage.googleapis.com/lets-read-asia/assets/images/68d9952e-2c01-47b5-9969-34744d27f275.png" },
  { id: "folktales", name: "Folktales", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/0a717f3a-d2f4-4e4a-acaf-1a70e06f4f4d.png" },
  { id: "science", name: "Science", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/d8847c19-1b73-4eec-af7d-20f1bba0bb6a.png" },
  { id: "arts", name: "Arts and Music", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/34138cfc-168c-457b-90a3-17cf4f51b943.png" },
  { id: "health", name: "Health", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/668d262c-4635-498f-9be2-47580a981d80.png" },
  { id: "funny", name: "Funny", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/54afd096-c063-4abf-937c-9910b4cffa27.png" },
  { id: "nonfiction", name: "Non-fiction", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/5d1e71d7-5691-4483-9f7f-3bbbef604113.png" },
  { id: "animals", name: "Animals", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/6fd731e5-e019-4fff-8df6-67174e11f51f.png" },
  { id: "adventure", name: "Adventure", icon: "https://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/e00d3de6-9f93-49b3-849d-36991e072447.png" },
  { id: "thinking", name: "Critical Thinking", icon: "http://storage.googleapis.com/lets-read-asia/assets/images/9b837ffe-7dca-4115-986a-d05271d49f3f.png" },
  { id: "community", name: "Community", icon: "http://storage.googleapis.com/lets-read-asia/assets/images/d836b186-51bf-4707-b0ba-9d90f5ffc8f6.png" },
  { id: "problem", name: "Problem Solving", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/0e3a44e4-4f2b-4ccf-80b6-8af9895a10c9.png" },
  { id: "superhero", name: "Superhero", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/0e0d8f3a-99a9-419d-84cb-d125ad5ec74a.png" },
  { id: "family", name: "Family & Friendship", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/6fa6b920-e6b8-40bd-b37e-3e1b95f8a1ad.png" },
  { id: "nature", name: "Nature", icon: "http://storage.googleapis.com/lets-read-dev.appspot.com/assets/images/5682328a-d84c-465a-8620-18179e14b57f.png" },
];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Books by Category</Text>
      <FlatList
        key={numColumns}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        data={items}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: width * 0.1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { width: cardSize, height: cardSize }]}
            onPress={() => onSelectCategory?.(item)}
          >
            <Image
              source={{ uri: item.icon }}
              resizeMode="contain"
              style={{
                width: iconSize,
                height: iconSize,
              }}
            />
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },
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

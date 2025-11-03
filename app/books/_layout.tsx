import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BooksLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2B7AFA",
        tabBarStyle: { paddingBottom: 6, height: 60 },
      }}
    >
      <Tabs.Screen
            name="index"
            options={{
                title: "All",
                tabBarIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />,
            }}
            />
            <Tabs.Screen
            name="readed"
            options={{
                title: "Readed",
                tabBarIcon: ({ color }) => <Ionicons name="checkmark-done-outline" size={22} color={color} />,
            }}
            />
            <Tabs.Screen
            name="favorite"
            options={{
                title: "Favorite",
                tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={22} color={color} />,
            }}
        />

    </Tabs>
  );
}

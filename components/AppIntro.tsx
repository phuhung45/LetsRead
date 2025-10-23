import { View, Text, Image, TouchableOpacity } from "react-native";

export default function AppIntro() {
  return (
    <View
      style={{
        width:"100%",
        flexDirection: "row",
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
      }}
    >
      {/* Bên trái: thông tin + tính năng */}
      <View style={{ flex: 1, paddingLeft: 250 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 20,
            color: "#15803d", // xanh lá
          }}
        >
          Let's Read Application
        </Text>

        {/* Tính năng */}
        {[
          { text: "Audio Books", icon: "🔊" },
          { text: "Sign Language Videos", icon: "🤟" },
          { text: "Offline Reading", icon: "⬇️" },
          { text: "Daily Goal Setting", icon: "📅" },
        ].map((item, index) => (
          <View
            key={index}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
          >
            <Text style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</Text>
            <Text style={{ fontSize: 16 }}>{item.text}</Text>
          </View>
        ))}

        {/* Nút tải app */}
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <TouchableOpacity style={{ marginRight: 12 }}>
            <Image
              source={require("../assets/images/google-play.png")}
              style={{ width: 150, height: 50, resizeMode: "contain" }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require("../assets/images/app-store.png")}
              style={{ width: 150, height: 50, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bên phải: hình mockup app */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Image
          source={require("../assets/images/letsreadapp.png")}
          style={{ width: 450, height: 450, resizeMode: "contain" }}
        />
      </View>
    </View>
  );
}

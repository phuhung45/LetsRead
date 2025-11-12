import React from "react";
import { View, Text, Image, TouchableOpacity, useWindowDimensions, ScrollView } from "react-native";

export default function AppIntro() {
  const { width } = useWindowDimensions();

  // breakpoints
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  // width hình mockup và padding động
  const leftPadding = isDesktop ? 250 : isTablet ? 50 : 20;
  const imageSize = isDesktop ? 450 : isTablet ? 300 : 200;

  return (
    <ScrollView horizontal={false} style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          padding: 10,
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
        }}
      >
        {/* Bên trái: thông tin + tính năng */}
        <View style={{ flex: 1, paddingLeft: leftPadding, marginBottom: isMobile ? 20 : 0 }}>
          <Text
            style={{
              fontSize: isDesktop ? 22 : isTablet ? 20 : 18,
              fontWeight: "bold",
              marginBottom: 20,
              color: "#15803d",
            }}
          >
            Asian Books Application
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
              <Text style={{ fontSize: isDesktop ? 18 : isTablet ? 16 : 14, marginRight: 10 }}>
                {item.icon}
              </Text>
              <Text style={{ fontSize: isDesktop ? 16 : isTablet ? 14 : 12 }}>{item.text}</Text>
            </View>
          ))}

          {/* Nút tải app */}
          <View style={{ flexDirection: "row", marginTop: 20, flexWrap: "wrap" }}>
            <TouchableOpacity style={{ marginRight: 12, marginBottom: 12 }}>
              <Image
                source={require("../assets/images/google-play.png")}
                style={{
                  width: isDesktop ? 150 : isTablet ? 120 : 100,
                  height: isDesktop ? 50 : isTablet ? 40 : 35,
                  resizeMode: "contain",
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginBottom: 12 }}>
              <Image
                source={require("../assets/images/app-store.png")}
                style={{
                  width: isDesktop ? 150 : isTablet ? 120 : 100,
                  height: isDesktop ? 50 : isTablet ? 40 : 35,
                  resizeMode: "contain",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bên phải: hình mockup app */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            marginTop: isMobile ? 20 : 0,
          }}
        >
          <Image
            source={require("../assets/images/letsreadapp.png")}
            style={{
              width: imageSize,
              height: imageSize,
              resizeMode: "contain",
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

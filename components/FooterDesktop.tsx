import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, useWindowDimensions } from "react-native";

export default function Footer() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return (
    <>
      <View
        style={[
          styles.footer,
          isDesktop ? styles.footerDesktop : isTablet ? styles.footerTablet : styles.footerMobile,
        ]}
      >
        {/* Left: Logo + Info (50%) */}
        <View style={[styles.column, isDesktop ? { flex: 5 } : { width: "100%" }]}>
          <Image source={require("../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Let’s Read is a program of The Asia Foundation</Text>
          <Text style={styles.desc}>
            The Asia Foundation is a nonprofit international development organization committed to improving lives and expanding opportunities across Asia and the Pacific. Informed by 70 years of experience and deep local knowledge, our work is focused on governance, education and leadership, environment and climate resilience, inclusive growth, international cooperation, and women’s empowerment.
          </Text>
        </View>

        {/* Download App */}
        <View style={[styles.column, isDesktop ? { flex: 1 } : isTablet ? { width: "30%" } : { width: "100%" }]}>
          <Text style={styles.title}>Download App</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://play.google.com/")}>
            <Image source={require("../assets/images/google-play.png")} style={styles.storeBtn} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/")}>
            <Image source={require("../assets/images/app-store.png")} style={styles.storeBtn} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Collaborators */}
        <View style={[styles.column, isDesktop ? { flex: 1 } : isTablet ? { width: "30%" } : { width: "100%" }]}>
          <Text style={styles.title}>Collaborators</Text>
          <TouchableOpacity><Text style={styles.link}>All Collaborators</Text></TouchableOpacity>
          <TouchableOpacity style={styles.translatorBtn}>
          </TouchableOpacity>
        </View>

        {/* Connect */}
        <View style={[styles.column, isDesktop ? { flex: 1 } : isTablet ? { width: "30%" } : { width: "100%" }]}>
          <Text style={styles.title}>Connect</Text>
          <TouchableOpacity><Text style={styles.link}>About Let's Read</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Let's Read Support</Text></TouchableOpacity>
          <TouchableOpacity style={styles.donateBtn}><Text style={styles.donateText}>♡ Donate</Text></TouchableOpacity>
        </View>
      </View>

      {/* Copyright */}
      <View style={styles.copyright}>
        <Text style={styles.copyText}>
          Copyright © 2025 The Asia Foundation | Privacy Policy | Accessibility Statement
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 20,
  },
  footerDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "10%",
  },
  footerTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: "5%",
  },
  footerMobile: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  column: {
    marginVertical: 10,
  },
  logo: { width: 150, height: 50, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 6 },
  desc: { fontSize: 12, color: "#333", lineHeight: 18 },
  storeBtn: { width: 130, height: 40, marginVertical: 4 },
  link: { fontSize: 13, color: "#333", marginBottom: 6 },
  translatorBtn: {
    marginTop: 6,
    width: 120,
    backgroundColor: "#1F8915",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  translatorText: { color: "#fff", fontWeight: "400", textAlign: "center", fontSize: 10 },
  donateBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#a2006e",
    borderRadius: 6,
    width: 90,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  donateText: { color: "#a2006e", fontWeight: "600", textAlign: "center" },
copyright: { 
  borderTopWidth: 1, 
  borderTopColor: "#eee", 
  paddingVertical: 10, 
  paddingLeft: "10%", // 👈 căn trái 10% 
  backgroundColor: "#fff", 
  // alignItems: "center", 
}, 
  copyText: { fontSize: 12, color: "#444", textAlign: "left", },
});

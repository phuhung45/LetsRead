import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function PDFContent({ pdfUrl }: { pdfUrl: string }) {
  if (!pdfUrl) return null;

  // Dùng Google viewer để load PDF công khai
  const encoded = encodeURIComponent(pdfUrl);
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encoded}`;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ uri: viewerUrl }}
        style={{ flex: 1 }}
        allowFileAccess
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500, // giữ UI không đổi, chỉ embed đúng vị trí bạn đang dùng
    width: "100%",
    backgroundColor: "#00000010",
  },
});

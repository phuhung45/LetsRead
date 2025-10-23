import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    image: require("../assets/images/cat_and_dog.png"),
    name: "Cat and Dog!",
    description: "Enjoy learning to read with Cat and Dog!",
    button: "Read Now!",
    target: "Category",
    params: { id: "animal" },
  },
  {
    id: 2,
    image: require("../assets/images/Beginning_Storybooks.png"),
    name: "Beginning Storybooks",
    description: "Get ready to read this year!",
    button: "Let's Read!",
    target: "Libary",
  },
  {
    id: 3,
    image: require("../assets/images/First_Storybooks.png"),
    name: "First Storybooks",
    description: "From Asia and the Pacific",
    button: "Explore now!",
    target: "Category",
    params: { id: "family" },
  },
  {
    id: 4,
    image: require("../assets/images/Everyday_STEM.png"),
    name: "Everyday STEM",
    description: "Light your imagination with this collection",
    button: "Read Now!",
    target: "Category",
    params: { id: "science" },
  },
  {
    id: 5,
    image: require("../assets/images/English_Decodable_Books.png"),
    name: "English Decodable Books",
    description: "Early readers from Asia and the Pacific",
    button: "Enjoy Now!",
    target: "Libary",
  },
  {
    id: 6,
    image: require("../assets/images/Earthquake.png"),
    name: "Earthquake!!!",
    description: "Books available in many languages.",
    button: "Get Reading!",
    target: "Category",
    params: { id: "family" },
  },
  {
    id: 7,
    image: require("../assets/images/Our_Amazing_Seasons.png"),
    name: "Our Amazing Seasons!",
    description: "Books about renewal and hope through the changing seasons",
    button: "Explore!",
    target: "Category",
    params: { id: "family" },
  },
  {
    id: 8,
    image: require("../assets/images/Indonesia_Early_Readers.png"),
    name: "Indonesia Early Readers",
    description: "Get started with fun storybooks from Indonesia",
    button: "Let's Read!",
    target: "Category",
    params: { id: "family" },
  },
];

export default function ImageSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();
  const [isMobile, setIsMobile] = useState(screenWidth < 768);

useEffect(() => {
  const subscription = Dimensions.addEventListener("change", ({ window }) => {
    setIsMobile(window.width < 768);
  });

  return () => {
    subscription?.remove();
  };
}, []);


  const goToSlide = (index: number) => {
    Animated.timing(translateX, {
      toValue: -index * screenWidth,
      duration: 500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
    setActiveIndex(index);
  };

  const nextSlide = () => goToSlide((activeIndex + 1) % slides.length);
  const prevSlide = () => goToSlide((activeIndex - 1 + slides.length) % slides.length);

  // Auto play
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  // Swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50) prevSlide();
        else if (gesture.dx < -50) nextSlide();
      },
    })
  ).current;

  return (
    <View style={{ height: 250, marginBottom: 20 }} {...panResponder.panHandlers}>
      <Animated.View
        style={{
          flexDirection: "row",
          width: screenWidth * slides.length,
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width: screenWidth, height: "100%" }}>
            <Image
              source={slide.image}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Overlay text */}
            <View
              style={[
                styles.overlay,
                isMobile ? { left: 10, bottom: 60 } : { left: 170, bottom: 110 },
              ]}
            >
              <Text style={styles.title}>{slide.name}</Text>
              <Text style={styles.description}>{slide.description}</Text>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate(slide.target, slide.params || {})
                }
              >
                <Text style={styles.buttonText}>{slide.button}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const scale = useRef(new Animated.Value(1)).current;
          const onPressIn = () => {
            Animated.spring(scale, { toValue: 1.4, useNativeDriver: true }).start();
          };
          const onPressOut = () => {
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
          };
          return (
            <Pressable
              key={index}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => goToSlide(index)}
            >
              <Animated.View
                style={[
                  styles.dot,
                  index === activeIndex ? styles.activeDot : null,
                  { transform: [{ scale }] },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Prev / Next (hidden on mobile) */}
      {!isMobile && (
        <>
          <TouchableOpacity style={styles.prevButton} onPress={prevSlide}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    right: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: "#fff",
    fontSize: 15,
    marginTop: 4,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 8,
    width: "100%",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  activeDot: { backgroundColor: "#f97316" },
  prevButton: {
    position: "absolute",
    top: "45%",
    left: 70,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    padding: 6,
  },
  nextButton: {
    position: "absolute",
    top: "45%",
    right: 70,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    padding: 6,
  },
});

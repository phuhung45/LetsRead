import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

import Header from "../../components/HeaderDesktop";
import FooterMobile from "../../components/FooterMobile";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    setErrorMsg("");
    setSuccessMsg("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrorMsg("Invalid email format.");
      return false;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return false;
    }
    if (mode === "register" && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleNavigate = (route: "home" | "library" | "profile") => {
    if (route === "home") router.push("/");
    else router.push(`/${route}`);
  };

  const handleAuth = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        router.replace("/profile");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setSuccessMsg("✅ Account created! Check your email to verify.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === "register" && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Log In" : "Register"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "Don't have an account? Register"
                : "Already registered? Login"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <FooterMobile active="profile" onNavigate={handleNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 25,
    fontWeight: "700",
    color: "green",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: 14,
    backgroundColor: "green",
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  error: { color: "red", marginBottom: 6 },
  success: { color: "green", marginBottom: 6 },
  switchText: { marginTop: 14, color: "gray" },
});

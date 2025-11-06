// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://diirbhfhrfpnrltxrlqa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXJiaGZocmZwbnJsdHhybHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTQxOTgsImV4cCI6MjA3NTAzMDE5OH0.Q45sp-8JWtx0I3QDo-7sQ4QA6NWorp1Gt8uSHDpDGf8";

// ✅ Web không hỗ trợ AsyncStorage → để undefined
// ✅ Mobile thì dùng AsyncStorage để giữ session
const storage = Platform.OS === "web" ? undefined : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,       // ✅ GIỮ SESSION
    autoRefreshToken: true,     // ✅ REFRESH TOKEN TỰ ĐỘNG
    detectSessionInUrl: false,  // ✅ BẮT BUỘC CHO EXPO
    storage,                    // ✅ Chỉ gắn storage cho mobile
  },
});

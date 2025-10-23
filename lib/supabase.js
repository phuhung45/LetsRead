// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://diirbhfhrfpnrltxrlqa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXJiaGZocmZwbnJsdHhybHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTQxOTgsImV4cCI6MjA3NTAzMDE5OH0.Q45sp-8JWtx0I3QDo-7sQ4QA6NWorp1Gt8uSHDpDGf8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clpcmsgqjqakdythfbpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscGNtc2dxanFha2R5dGhmYnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MDIzNzcsImV4cCI6MjA1MzI3ODM3N30.4tAFHOZ6K5jd194VkG1z6ZAPoBNlFs39QtNT0j49fRU';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
  }
);

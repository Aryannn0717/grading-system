import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://yzxidqwanrqrszjdjnpv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6eGlkcXdhbnJxcnN6amRqbnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjkxNzQsImV4cCI6MjA2MzMwNTE3NH0.JD3ipdtRnOysLoHmQ90q_aqu7NPPGw2jDnaXtRP3yP4"
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://slpgrbpexudmpngnfudb.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscGdyYnBleHVkbXBuZ25mdWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTUyNTYsImV4cCI6MjA3MTc3MTI1Nn0.sMMZPEVGvFcBOtQTdYocWNwtTVb57KjR2zI1Fg1XSuI"

export const supabase = createClient(supabaseUrl, supabaseKey)

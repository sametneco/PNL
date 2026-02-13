
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cypzhzxaprudrvqzxifx.supabase.co';
// Bu key PUBLIC (Anon) key olmalı.
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cHpoenhhcHJ1ZHJ2cXp4aWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg4OTUsImV4cCI6MjA4NjU2NDg5NX0.yI25RzTFJxIc-xKPiPUhGPQZDgnuD-wNtKJb24xfhMM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;

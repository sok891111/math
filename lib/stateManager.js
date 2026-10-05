import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const USERS_FILE = path.join(process.cwd(), 'users.json');
const USERS_KEY = 'block_island_users';

let memoryStore = {
  [USERS_KEY]: []
};

const isDevOrLocal = () =>
  process.env.NODE_ENV === 'development' || !process.env.VERCEL;

function useKV() {
  return !!supabase;
}

// ─── getUsers ────────────────────────────────────────────────────────────────
export async function getUsers() {
  if (useKV()) {
    try {
      const { data, error } = await supabase
        .from('kv_store')
        .select('value')
        .eq('key', USERS_KEY)
        .single();
      if (!error && data?.value) {
        return Array.isArray(data.value) ? data.value : [];
      }
      if (error && error.code !== 'PGRST116') {
        console.error('[KV] getUsers error:', error.message);
      }
    } catch (e) {
      console.error('[KV] getUsers exception:', e);
    }
  }

  if (isDevOrLocal()) {
    try {
      if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('[File] getUsers error:', e);
    }
  }

  return memoryStore[USERS_KEY] || [];
}

// ─── getUser ─────────────────────────────────────────────────────────────────
export async function getUser(userId) {
  if (!userId) return null;
  const users = await getUsers();
  return users.find(u => u.id === userId) || null;
}

// ─── saveUsers ───────────────────────────────────────────────────────────────
export async function saveUsers(users) {
  if (useKV()) {
    try {
      const { error } = await supabase
        .from('kv_store')
        .upsert({ key: USERS_KEY, value: users }, { onConflict: 'key' });
      if (!error) return;
      console.error('[KV] saveUsers error:', error.message);
    } catch (e) {
      console.error('[KV] saveUsers exception:', e);
    }
  }

  if (isDevOrLocal()) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      return;
    } catch (e) {
      console.error('[File] saveUsers error:', e);
    }
  }

  memoryStore[USERS_KEY] = users;
}

// ─── getState / saveState (옵션 유저별 게임 상태 저장 지원) ───────────────────
export async function getState(userId) {
  const key = `block_state_${userId}`;
  if (useKV()) {
    try {
      const { data, error } = await supabase
        .from('kv_store')
        .select('value')
        .eq('key', key)
        .single();
      if (!error && data?.value) return data.value;
    } catch (e) {
      console.error('[KV] getState exception:', e);
    }
  }

  if (isDevOrLocal()) {
    try {
      const f = path.join(process.cwd(), `state_${userId}.json`);
      if (fs.existsSync(f)) {
        return JSON.parse(fs.readFileSync(f, 'utf8'));
      }
    } catch (e) {
      console.error('[File] getState exception:', e);
    }
  }

  return memoryStore[key] || null;
}

export async function saveState(state, userId) {
  const key = `block_state_${userId}`;
  if (useKV()) {
    try {
      await supabase
        .from('kv_store')
        .upsert({ key, value: state }, { onConflict: 'key' });
      return;
    } catch (e) {
      console.error('[KV] saveState exception:', e);
    }
  }

  if (isDevOrLocal()) {
    try {
      const f = path.join(process.cwd(), `state_${userId}.json`);
      fs.writeFileSync(f, JSON.stringify(state, null, 2));
      return;
    } catch (e) {
      console.error('[File] saveState exception:', e);
    }
  }

  memoryStore[key] = state;
}

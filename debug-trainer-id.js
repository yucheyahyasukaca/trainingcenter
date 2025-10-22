// Script untuk debug trainer_id di browser console
// Jalankan di browser console pada halaman trainer dashboard

console.log('🔍 Debugging trainer_id...');

// 1. Cek profile yang sedang login
console.log('1. Current profile:');
console.log('Profile object:', window.profile || 'Not found on window');
console.log('Auth state:', window.authState || 'Not found on window');

// 2. Cek localStorage untuk auth token
console.log('2. Auth token:');
const authToken = localStorage.getItem('sb-your-project-auth-token');
if (authToken) {
  try {
    const parsed = JSON.parse(authToken);
    console.log('Parsed auth token:', parsed);
    if (parsed.currentSession?.user) {
      console.log('User ID from token:', parsed.currentSession.user.id);
      console.log('User email from token:', parsed.currentSession.user.email);
    }
  } catch (e) {
    console.log('Could not parse auth token:', e);
  }
} else {
  console.log('No auth token found');
}

// 3. Cek semua localStorage keys yang mungkin relevan
console.log('3. All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('supabase')) {
    console.log('Key:', key, 'Value:', localStorage.getItem(key));
  }
}

// 4. Cek sessionStorage
console.log('4. SessionStorage:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && key.includes('supabase')) {
    console.log('Key:', key, 'Value:', sessionStorage.getItem(key));
  }
}

// 5. Cek React DevTools jika tersedia
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('5. React DevTools available');
  console.log('React DevTools:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
}

// 6. Cek global variables
console.log('6. Global variables:');
console.log('window.supabase:', typeof window.supabase);
console.log('window.auth:', typeof window.auth);
console.log('window.user:', typeof window.user);

console.log('✅ Debug complete. Check the output above for trainer_id information.');

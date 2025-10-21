// Clear Browser Cache Script
// Jalankan di browser console (F12)

console.log('🧹 Clearing browser cache...');

// Clear localStorage
try {
  localStorage.clear();
  console.log('✅ localStorage cleared');
} catch (e) {
  console.log('❌ Error clearing localStorage:', e);
}

// Clear sessionStorage
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
} catch (e) {
  console.log('❌ Error clearing sessionStorage:', e);
}

// Clear IndexedDB
if ('indexedDB' in window) {
  try {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
      console.log('✅ IndexedDB cleared');
    });
  } catch (e) {
    console.log('❌ Error clearing IndexedDB:', e);
  }
}

// Clear service worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
    console.log('✅ Service workers cleared');
  });
}

// Clear cookies (if possible)
try {
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ Cookies cleared');
} catch (e) {
  console.log('❌ Error clearing cookies:', e);
}

console.log('🎉 Browser cache cleared! Reloading page...');

// Reload page
setTimeout(() => {
  location.reload();
}, 1000);

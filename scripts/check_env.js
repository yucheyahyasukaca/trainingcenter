const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });

    console.log('NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SITE_URL:', env.NEXT_PUBLIC_SITE_URL);
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

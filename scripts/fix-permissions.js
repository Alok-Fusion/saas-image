
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only run on non-Windows platforms (like Vercel)
if (process.platform !== 'win32') {
    const binaries = ['vite'];
    const binDir = path.resolve(__dirname, '..', 'node_modules', '.bin');

    binaries.forEach(bin => {
        const binPath = path.join(binDir, bin);
        if (fs.existsSync(binPath)) {
            try {
                fs.chmodSync(binPath, '755');
                console.log(`Fixed permissions for ${bin}`);
            } catch (e) {
                console.error(`Error fixing permissions for ${bin}:`, e.message);
            }
        } else {
            console.log(`Binary not found: ${bin}`);
        }
    });
} else {
    console.log('Skipping permission fix on Windows');
}

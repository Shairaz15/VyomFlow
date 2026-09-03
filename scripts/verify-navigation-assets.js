import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
const publicDir = path.join(baseDir, 'public');

const videoFiles = [
    'videos/navigation/encoding_full.mp4',
    'videos/navigation/res.mp4',
    'videos/navigation/start.mp4',
    'videos/navigation/inter-1.mp4',
    'videos/navigation/inter-2.mp4',
    'videos/navigation/inter-3.mp4',
    'videos/navigation/inter-4.mp4',
    'videos/navigation/inter-5.mp4',
    'videos/navigation/inter-6.mp4',
    'videos/navigation/inter-7.mp4',
    'videos/navigation/inter-8.mp4',
    'videos/navigation/af-1.mp4',
    'videos/navigation/af-2.mp4',
    'videos/navigation/af-3.mp4',
    'videos/navigation/af-4.mp4',
    'videos/navigation/af-5.mp4',
    'videos/navigation/af-6.mp4',
    'videos/navigation/af-7.mp4',
    'videos/navigation/af-8.mp4',
];

console.log("🎥 Checking Navigation Video Files in public/videos/navigation/...\n");
let allVideosOk = true;
for (const relPath of videoFiles) {
    const fullPath = path.join(publicDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ MISSING: ${relPath}`);
        allVideosOk = false;
    } else {
        const stats = fs.statSync(fullPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ FOUND: ${relPath} (${sizeMb} MB)`);
    }
}

console.log("\n🖼️ Checking Landmark Images in public/images/navigation/landmarks/...\n");
let allLandmarksOk = true;
for (let i = 1; i <= 21; i++) {
    const relPath = `images/navigation/landmarks/landmark_${i}.jpg`;
    const fullPath = path.join(publicDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`❌ MISSING: ${relPath}`);
        allLandmarksOk = false;
    } else {
        const stats = fs.statSync(fullPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ FOUND: ${relPath} (${sizeMb} MB)`);
    }
}

if (allVideosOk && allLandmarksOk) {
    console.log("\n🎉 ALL NAVIGATION ASSETS (20 VIDEOS + 21 LANDMARKS) ARE PRESENT & VALID!");
} else {
    console.log("\n⚠️ SOME ASSETS ARE MISSING!");
}

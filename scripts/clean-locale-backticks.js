import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

function cleanString(str) {
    if (typeof str !== 'string') return str;
    if (!str.includes('```')) return str;

    let cleaned = str;

    // Remove leading code fence like ```tamil\n, ```hindi\n, ```\n, ```
    cleaned = cleaned.replace(/^```[^\n]*\n?/, '');

    // Remove trailing code fence like \n```, ```
    cleaned = cleaned.replace(/\n?```\s*$/, '');

    // Remove any inline remaining ```
    cleaned = cleaned.replace(/```/g, '');

    return cleaned.trim();
}

function sanitizeObject(obj) {
    let modifiedCount = 0;

    for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
            const cleaned = cleanString(val);
            if (cleaned !== val) {
                obj[key] = cleaned;
                modifiedCount++;
            }
        } else if (typeof val === 'object' && val !== null) {
            modifiedCount += sanitizeObject(val);
        }
    }

    return modifiedCount;
}

let totalFixed = 0;

for (const file of files) {
    const filePath = path.join(localesDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);

    const count = sanitizeObject(json);
    if (count > 0) {
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
        console.log(`✅ ${file}: Fixed ${count} strings.`);
        totalFixed += count;
    }
}

console.log(`\n🎉 Total strings sanitized: ${totalFixed}`);

import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

let totalIssues = 0;

for (const file of files) {
    const p = path.join(localesDir, file);
    const content = fs.readFileSync(p, 'utf8');
    const json = JSON.parse(content);
    const issues = [];

    function checkObj(obj, prefix = '') {
        for (const [k, v] of Object.entries(obj)) {
            const keyPath = prefix ? `${prefix}.${k}` : k;
            if (typeof v === 'string') {
                if (v.includes('```')) {
                    issues.push({ key: keyPath, val: v });
                }
            } else if (typeof v === 'object' && v !== null) {
                checkObj(v, keyPath);
            }
        }
    }

    checkObj(json);
    if (issues.length > 0) {
        console.log(`${file} -> ${issues.length} issues`);
        for (const issue of issues) {
            console.log(`   [${issue.key}]: ${JSON.stringify(issue.val)}`);
        }
        totalIssues += issues.length;
    }
}
console.log(`\nTotal issues across all locale files: ${totalIssues}`);

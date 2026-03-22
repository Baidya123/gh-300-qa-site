const fs = require('fs-extra');
const path = require('path');

// Input and output files
const inputFile = 'az-900.json';
const outputFile = 'az-900-local.json';
const imagesDir = path.join('resources', 'images');

// Helper to extract image URLs from a string (markdown or HTML)
function extractImageUrls(text) {
    if (!text) return [];
    const mdRegex = /!\[.*?\]\((.*?)\)/g;
    const htmlRegex = /<img[^>]+src="([^"]+)"/g;
    let urls = [];
    let match;
    while ((match = mdRegex.exec(text))) urls.push(match[1]);
    while ((match = htmlRegex.exec(text))) urls.push(match[1]);
    return urls;
}

// Replace remote image URLs with local paths
function replaceImageUrls(text, downloadedSet) {
    if (!text) return text;
    // Markdown
    text = text.replace(/!\[(.*?)\]\((https?:\/\/[^)]+)\)/g, (m, alt, url) => {
        const filename = path.basename(url.split('?')[0]);
        if (downloadedSet.has(filename)) {
            return `![${alt}](${imagesDir}/${filename})`;
        }
        return m;
    });
    // HTML
    text = text.replace(/<img([^>]+)src="(https?:\/\/[^">]+)"/g, (m, before, url) => {
        const filename = path.basename(url.split('?')[0]);
        if (downloadedSet.has(filename)) {
            return `<img${before}src="${imagesDir}/${filename}"`;
        }
        return m;
    });
    return text;
}

(async () => {
    // Get all downloaded image filenames
    const files = await fs.readdir(imagesDir);
    const downloadedSet = new Set(files);

    const data = await fs.readJson(inputFile);
    for (const q of data.questions || []) {
        q.question = replaceImageUrls(q.question, downloadedSet);
        if (q.answers) {
            for (let i = 0; i < q.answers.length; i++) {
                q.answers[i] = replaceImageUrls(q.answers[i], downloadedSet);
            }
        }
        if (q.correct_answer) {
            for (let i = 0; i < q.correct_answer.length; i++) {
                q.correct_answer[i] = replaceImageUrls(q.correct_answer[i], downloadedSet);
            }
        }
    }
    await fs.writeJson(outputFile, data, { spaces: 2 });
    console.log(`Updated image references written to ${outputFile}`);
})();


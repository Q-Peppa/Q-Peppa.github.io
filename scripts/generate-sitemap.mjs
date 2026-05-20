#!/usr/bin/env node

/**
 * sitemap.xml 生成脚本
 * 在 rspress build 完成后运行，扫描 doc_build 目录下所有 .html 文件生成 sitemap。
 *
 * 用法: node scripts/generate-sitemap.mjs
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = 'https://pi-doc.com';
const BUILD_DIR = new URL('../doc_build', import.meta.url).pathname;

/** 收集所有 .html 文件路径（排除 404.html） */
function collectHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== '404.html') {
      files.push(fullPath);
    }
  }
  return files;
}

function generateSitemap(htmlFiles) {
  const urls = htmlFiles
    .map((file) => {
      // 去掉 BUILD_DIR 前缀和 index.html，得到路径
      let routePath = file
        .replace(BUILD_DIR, '')
        .replace(/\/index\.html$/, '/')
        .replace(/\.html$/, '');
      // 如果路径末尾不是 /，保持原样
      if (!routePath.endsWith('/')) {
        routePath = routePath;
      }
      return `  <url>
    <loc>${SITE_URL}${routePath}</loc>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// --- main ---
const htmlFiles = collectHtmlFiles(BUILD_DIR);
console.log(`发现 ${htmlFiles.length} 个 HTML 文件`);

const sitemap = generateSitemap(htmlFiles);
writeFileSync(join(BUILD_DIR, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`sitemap.xml 已生成 (${sitemap.length} bytes)`);

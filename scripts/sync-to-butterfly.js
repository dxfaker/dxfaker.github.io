#!/usr/bin/env node
/**
 * 同步 Astro content 到 Butterfly Hexo
 * 运行: node scripts/sync-to-butterfly.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASTRO_CONTENT = path.join(ROOT, 'src/content');
const BUTTERFLY_SOURCE = path.join(ROOT, 'classic/source');

// 同步文章
async function syncPosts() {
  const postsDir = path.join(ASTRO_CONTENT, 'posts');
  const targetDir = path.join(BUTTERFLY_SOURCE, '_posts');
  
  await fs.mkdir(targetDir, { recursive: true });
  
  const files = await fs.readdir(postsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(postsDir, file), 'utf-8');
    const converted = convertAstroToHexo(content);
    await fs.writeFile(path.join(targetDir, file), converted);
  }
  
  console.log(`✓ 同步了 ${mdFiles.length} 篇文章`);
}

// 同步友链 - 从 src/data/friends.json 读取
async function syncFriends() {
  const friendsFile = path.join(ROOT, 'src/data/friends.json');
  const targetFile = path.join(BUTTERFLY_SOURCE, '_data/links.yml');

  try {
    const data = await fs.readFile(friendsFile, 'utf-8');
    const friends = JSON.parse(data);

    // 转换为 YAML
    const yaml = friends.map(f => `
${f.title}:
  link: ${f.siteurl}
  avatar: ${f.imgurl}
  descr: ${f.desc}
`).join('');

    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, yaml);
    console.log('✓ 同步了友链');
  } catch (e) {
    console.log('✗ 友链同步失败:', e.message);
  }
}

// 转换 frontmatter 格式
function convertAstroToHexo(content) {
  return content
    .replace(/^published:\s*(.+)$/m, 'date: $1 00:00:00')
    .replace(/^updated:\s*(.+)$/m, 'updated: $1 00:00:00')
    .replace(/^category:\s*(.+)$/m, 'categories: [$1]')
    .replace(/^toc:\s*(.+)$/m, 'toc: $1\ncomments: true');
}

async function main() {
  console.log('🔄 开始同步数据到 Butterfly...\n');
  
  await syncPosts();
  await syncFriends(); // 添加友链同步

  console.log('\n✅ 同步完成');
}

main().catch(console.error);
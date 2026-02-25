#!/usr/bin/env node
/**
 * 统一部署脚本：构建 Mizuki + Butterfly，合并输出
 * 运行: node scripts/deploy-all.js
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..'); // mizukii 根目录
const CLASSIC_DIR = path.join(ROOT, 'classic');

async function main() {
  console.log('🚀 开始统一部署流程...\n');

  // 1. 同步数据到 Butterfly
  console.log('📤 步骤 1: 同步数据到 Butterfly');
  execSync('node scripts/sync-to-butterfly.js', { 
    cwd: ROOT, 
    stdio: 'inherit' 
  });

  // 2. 构建 Mizuki (Astro)
  console.log('\n🔨 步骤 2: 构建 Mizuki (Astro)');
  execSync('pnpm build', { 
    cwd: ROOT, 
    stdio: 'inherit' 
  });

  // 3. 构建 Butterfly (Hexo)
  console.log('\n🔨 步骤 3: 构建 Butterfly (Hexo)');
  execSync('npx hexo generate', { 
    cwd: CLASSIC_DIR, 
    stdio: 'inherit',
    shell: true
  });

  // 4. 合并构建结果
  console.log('\n📦 步骤 4: 合并构建结果');
  const mizukiDist = path.join(ROOT, 'dist');
  const butterflyDist = path.join(CLASSIC_DIR, 'public');
  const classicTarget = path.join(mizukiDist, 'classic');

  // 确保目标目录存在
  await fs.mkdir(classicTarget, { recursive: true });
  // 复制 Butterfly 的 public 到 Mizuki 的 dist/classic
  await fs.cp(butterflyDist, classicTarget, { recursive: true, force: true });

  console.log('\n✅ 构建完成！');
  console.log('📁 输出目录: dist/');
  console.log('   - dist/           (Mizuki 主站)');
  console.log('   - dist/classic/   (Butterfly 经典版)');
  console.log('\n🚀 现在你可以将 dist 目录部署到服务器了。');
}

main().catch(err => {
  console.error('❌ 部署失败:', err);
  process.exit(1);
});
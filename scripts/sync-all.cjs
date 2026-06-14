/**
 * 一键同步脚本 — 完整构建流程
 * 用法: node scripts/sync-all.cjs [选项]
 * 
 * 选项:
 *   --skip-astro    跳过 Astro 构建
 *   --skip-hexo     跳过 Hexo 构建  
 *   --skip-enhance  跳过 Classic HTML 增强注入
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const skipAstro = args.includes('--skip-astro');
const skipHexo = args.includes('--skip-hexo');
const skipEnhance = args.includes('--skip-enhance');

const ROOT = path.resolve(__dirname, '..');
const CLASSIC = path.join(ROOT, 'classic');

function run(cmd, cwd, label) {
  console.log(`\n[${label}] ${cmd}`);
  execSync(cmd, { cwd: cwd || ROOT, stdio: 'inherit' });
}

console.log('═══════════════════════════════════════');
console.log('  Mizuki + Classic 一键同步构建');
console.log('═══════════════════════════════════════');

// 1. Astro 构建
if (!skipAstro) {
  console.log('\n▶ 步骤 1/5: Astro (Mizuki) 构建...');
  run('pnpm build', ROOT, 'Astro');
} else {
  console.log('\n⊘ 跳过 Astro 构建');
}

// 2. 同步文章到 Classic
if (!skipHexo) {
  console.log('\n▶ 步骤 2/5: 同步文章...');
  run('node scripts/sync-posts.cjs', ROOT, 'Posts');

  // 3. 同步图片到 Classic
  console.log('\n▶ 步骤 3/5: 同步图片...');
  const srcImages = path.join(ROOT, 'public', 'images');
  const dstImages = path.join(CLASSIC, 'source', 'images');
  if (fs.existsSync(srcImages)) {
    run(`xcopy "${srcImages}\\*" "${dstImages}\\" /E /I /Y /Q`, ROOT, 'Images');
    console.log('  图片同步完成');
  }
}

// 4. Classic 构建
if (!skipHexo) {
  console.log('\n▶ 步骤 4/5: Classic (Hexo) 构建...');
  if (fs.existsSync(path.join(CLASSIC, 'node_modules', '.bin', 'hexo'))) {
    run('npx hexo generate', CLASSIC, 'Hexo');
  } else {
    console.log('  ⚠ Classic 未安装依赖，跳过 (运行 cd classic && pnpm install)');
  }
}

if (!skipHexo) {
  const classicPublic = path.join(CLASSIC, 'public');
  if (fs.existsSync(classicPublic)) {
    run(`xcopy "${classicPublic}\\*" "public\\classic\\" /E /I /Y /Q`, ROOT, 'Copy→public');
  }
}

// 5. 增强 Classic HTML
if (!skipEnhance && !skipHexo) {
  console.log('\n▶ 步骤 5/5: 注入 Classic 增强效果...');
  run('node scripts/enhance-classic.cjs', ROOT, 'Enhance');
}

console.log('\n═══════════════════════════════════════');
console.log('  ✅ 全站同步完成!');
console.log('  pnpm dev → http://localhost:4321/classic/');
console.log('═══════════════════════════════════════');

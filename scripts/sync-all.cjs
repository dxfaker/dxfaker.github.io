/**
 * 一键同步脚本 — 完整构建流程
 * 用法: node scripts/sync-all.cjs [选项]
 * 
 * 选项:
 *   --skip-astro    跳过 Astro 构建 (默认会构建)
 *   --skip-hexo     跳过 Hexo 构建 (默认会构建)
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
  console.log('\n▶ 步骤 1/4: Astro (Mizuki) 构建...');
  run('pnpm build', ROOT, 'Astro');
} else {
  console.log('\n⊘ 跳过 Astro 构建');
}

// 2. Classic 构建
if (!skipHexo) {
  console.log('\n▶ 步骤 2/4: Classic (Hexo) 构建...');
  if (fs.existsSync(path.join(CLASSIC, 'node_modules', '.bin', 'hexo'))) {
    run('npx hexo generate', CLASSIC, 'Hexo');
  } else {
    console.log('  ⚠ Classic 未安装依赖，跳过 (运行 cd classic && pnpm install)');
  }
} else {
  console.log('\n⊘ 跳过 Hexo 构建');
}

if (!skipHexo) {
  // 3. 部署 Classic 构建产物
  console.log('\n▶ 步骤 3/4: 部署 Classic 静态文件...');
  const classicPublic = path.join(CLASSIC, 'public');
  if (fs.existsSync(classicPublic)) {
    // 复制到 public/classic/（Astro dev 服务器用）
    run(`xcopy "${classicPublic}\\*" "public\\classic\\" /E /I /Y /Q`, ROOT, 'Copy→public');
    // 复制到 classic/ 根（直接访问用）
    run(`xcopy "${classicPublic}\\*" "${CLASSIC}\\" /E /I /Y /Q`, ROOT, 'Copy→classic');
  }
}

// 4. 增强 Classic HTML
if (!skipEnhance && !skipHexo) {
  console.log('\n▶ 步骤 4/4: 注入 Classic 增强效果...');
  run('node scripts/enhance-classic.cjs', ROOT, 'Enhance');
} else {
  console.log('\n⊘ 跳过增强注入');
}

console.log('\n═══════════════════════════════════════');
console.log('  ✅ 全站同步完成!');
console.log('  Astro  Dev:  pnpm dev');
console.log('  Astro  Preview: pnpm preview');
console.log('  Classic:  http://localhost:4321/classic/');
console.log('═══════════════════════════════════════');

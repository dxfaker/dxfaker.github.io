/**
 * Sync Astro friends.json → Hexo Classic link.yml
 * 数据源: src/data/friends.json（唯一真源）
 * 输出: classic/source/_data/link.yml
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'data', 'friends.json');
const DST = path.join(ROOT, 'classic', 'source', '_data', 'link.yml');

if (!fs.existsSync(SRC)) {
  console.error('找不到数据源: ' + SRC);
  process.exit(1);
}

const friends = JSON.parse(fs.readFileSync(SRC, 'utf-8').replace(/^\uFEFF/, ''));

// YAML 字符串转义（处理冒号、井号、引号等）
function yq(str) {
  const s = String(str == null ? '' : str);
  if (/[:#\[\]{}&*!|>'"%@`,\n]/.test(s) || /^\s|\s$/.test(s)) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return s;
}

const lines = ['- class_name: 友链', '  class_desc: 我的朋友们', '  link_list:'];

for (const f of friends) {
  lines.push(`    - name: ${yq(f.title)}`);
  lines.push(`      link: ${yq(f.siteurl)}`);
  lines.push(`      avatar: ${yq(f.imgurl)}`);
  lines.push(`      descr: ${yq(f.desc)}`);
}

fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.writeFileSync(DST, lines.join('\n') + '\n', 'utf-8');

// 检查本地头像是否存在
let missing = 0;
for (const f of friends) {
  if (f.imgurl?.startsWith('/')) {
    const p = path.join(ROOT, 'public', f.imgurl);
    if (!fs.existsSync(p)) {
      console.log(`  ⚠ 缺图: ${f.title} → ${f.imgurl}`);
      missing++;
    }
  }
}

console.log(`\n✓ 友链同步完成: ${friends.length} 位好友 → classic/source/_data/link.yml`);
if (missing > 0) console.log(`  其中 ${missing} 个头像文件缺失，请补充到 public/images/friend/`);

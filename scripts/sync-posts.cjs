/**
 * Sync Astro posts → Hexo Classic posts
 * Frontmatter mapping: published→date, category→categories, image→cover
 */
const fs = require('fs');
const path = require('path');

const ASTRO_POSTS_DIR = 'd:/mywebsite/mizukii/src/content/posts';
const HEXO_POSTS_DIR = 'd:/mywebsite/mizukii/classic/source/_posts';

fs.mkdirSync(HEXO_POSTS_DIR, { recursive: true });

const files = fs.readdirSync(ASTRO_POSTS_DIR).filter(f => f.endsWith('.md'));
let synced = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(ASTRO_POSTS_DIR, file), 'utf-8').replace(/^\uFEFF/, '');

  const m = raw.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!m) { console.log('SKIP: ' + file); continue; }

  let fm = m[1];
  fm = fm.replace(/^published:\s*(.+)$/m, 'date: $1 00:00:00');
  fm = fm.replace(/^category:\s*(.+)$/m, 'categories: [$1]');
  fm = fm.replace(/^image:\s*(.+)$/m, 'cover: $1');
  if (!fm.includes('comments:')) fm += '\ncomments: true';

  const body = raw.slice(m[0].length).trim();

  // 把正文里的相对图片引用转成 <img> 标签
  //（Classic 站点的 hexo-renderer-marked 对含中文/空格的 markdown 图片语法不稳定，
  //   用 <img> 标签 100% 可靠）
  const bodyFixed = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => {
    // 如果已经是绝对路径 /images/post/ 开头，保留
    const finalSrc = src.startsWith('/') ? src : `/images/post/${src}`;
    return `<img src="${finalSrc}" alt="${alt}" />`;
  });

  fs.writeFileSync(path.join(HEXO_POSTS_DIR, file), `---\n${fm}\n---\n\n${bodyFixed}\n`, 'utf-8');
  console.log('SYNCED: ' + file);
  synced++;
}

console.log('\nDone: ' + synced + ' posts synced');

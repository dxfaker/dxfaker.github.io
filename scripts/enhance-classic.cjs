const fs = require('fs');
const path = require('path');

function walk(dir, exclude) {
  const res = [];
  for (const item of fs.readdirSync(dir)) {
    if (exclude.includes(item)) continue;
    const p = path.join(dir, item);
    try {
      if (fs.statSync(p).isDirectory()) res.push(...walk(p, exclude));
      else if (item.endsWith('.html')) res.push(p);
    } catch {}
  }
  return res;
}

const CSS = `<style>
/* === 全屏固定背景封面 === */
body::before{content:"";position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-999;background:url(/classic/images/back.jpg) center/cover no-repeat;pointer-events:none}
/* === 全屏 header，背景透明露出封面 === */
#page-header{height:100vh!important;min-height:100vh!important;max-height:100vh!important;background:transparent!important}
#page-header #page-site-info,#page-header #site-info{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;text-align:center;z-index:10}
#page-header #site-subtitle{margin-top:1rem!important;animation:fup 1s ease-out .3s both;color:#fff!important;font-weight:bold!important;text-shadow:0 0 10px rgba(0,0,0,.5)}
/* === 主标题白字+炫彩边框动画 === */
#page-header #site-title{font-size:3.5rem!important;letter-spacing:4px!important;animation:fup 1s ease-out}
#page-header #site-title .rb-text{display:inline-block;color:#fff!important;-webkit-text-fill-color:#fff!important;animation:rb-glow 3s linear infinite}
@keyframes rb-glow{
  0%{text-shadow:3px 0 0 #ff0000,-3px 0 0 #00ffff,0 3px 0 #ffff00,0 -3px 0 #ff00ff}
  20%{text-shadow:3px 0 0 #ff7f00,-3px 0 0 #00ffff,0 3px 0 #00ff00,0 -3px 0 #ff0000}
  40%{text-shadow:3px 0 0 #ffff00,-3px 0 0 #7f00ff,0 3px 0 #0080ff,0 -3px 0 #ff7f00}
  60%{text-shadow:3px 0 0 #00ff00,-3px 0 0 #ff00ff,0 3px 0 #ff0000,0 -3px 0 #0080ff}
  80%{text-shadow:3px 0 0 #0080ff,-3px 0 0 #ff7f00,0 3px 0 #ff00ff,0 -3px 0 #00ff00}
  100%{text-shadow:3px 0 0 #ff0000,-3px 0 0 #00ffff,0 3px 0 #ffff00,0 -3px 0 #ff00ff}
}
@keyframes fup{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
/* === 滚动箭头 === */
.scroll-down-hint{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);color:#fff;font-size:2rem;animation:bounce-arrow 2s infinite;cursor:pointer;z-index:10}
@keyframes bounce-arrow{0%,20%,50%,80%,100%{transform:translateX(-50%) translateY(0)}40%{transform:translateX(-50%) translateY(-15px)}60%{transform:translateX(-50%) translateY(-7px)}}
@media(max-width:768px){#page-header #site-title{font-size:2rem!important}}
/* === 毛玻璃内容区 === */
#content-inner,#recent-posts,.aside-content{background:rgba(255,255,255,.85)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.card-widget,.recent-post-item{background:rgba(255,255,255,.9)!important}
[data-theme=dark] #content-inner,[data-theme=dark] #recent-posts,[data-theme=dark] .aside-content{background:rgba(30,30,30,.85)!important}
[data-theme=dark] .card-widget,[data-theme=dark] .recent-post-item{background:rgba(45,45,45,.9)!important}
canvas#fw-particles{z-index:0!important}
/* === 标题居中 === */
#page-header #site-info{padding:2.5rem 4rem!important;position:relative!important;background:transparent!important}
@media(max-width:768px){#page-header #site-info{padding:1.5rem 1.5rem!important}}
</style>`;

const JS = `<script src="/classic/js/particles.js"></script>
<script>(function(){
  var t=document.querySelector('#page-header #site-title');
  if(t&&!t.querySelector('.rb-text')){var s=t.textContent.trim();t.innerHTML='<span class="rb-text">'+s+'</span>'}
})();</script>`;

// Only remove stuff we're SURE about
function safeClean(html) {
  return html
    // Remove ONLY old canvas-nest CDN (specific URL)
    .replace(/<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/canvas-nest\.js[^<]*<\/script>/gi, '')
    .replace(/<link\s+[^>]*fullcover\.css[^>]*>/gi, '')
    .replace(/<script\s+src="\/js\/framework-switch\.js"[^<]*><\/script>/gi, '');
}

const ROOT = path.resolve(__dirname, '..');
const dirs = [
  path.join(ROOT, 'public', 'classic'),
  path.join(ROOT, 'classic'),
];
const exclude = ['themes', 'node_modules', 'css', 'js', 'images', 'img', 'assets', 'public'];

let total = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    console.log('SKIP (not found): ' + dir);
    continue;
  }
  for (const f of walk(dir, exclude)) {
    let c = safeClean(fs.readFileSync(f, 'utf-8'));
    if (!c.includes('</head>') || !c.includes('</body>')) {
      console.log('SKIPPED (corrupted): ' + f);
      continue;
    }
    c = c.replace('</head>', CSS + '\n</head>');
    c = c.replace('</body>', JS + '\n</body>');
    fs.writeFileSync(f, c, 'utf-8');
    total++;
  }
}
console.log('Enhanced: ' + total);

/**
 * Golden floating particles - 金色漂浮粒子特效
 * 类似 sakura 或 firefly 效果，缓慢漂浮的金色小点
 */
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fw-particles';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0'
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3 - 0.2;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.fadeSpeed = Math.random() * 0.005 + 0.002;
      this.fading = Math.random() > 0.5;
      // 金色/暖黄色调
      const hue = Math.random() * 40 + 30; // 30-70 (金色到黄色)
      const sat = Math.random() * 30 + 70; // 70-100%
      const light = Math.random() * 30 + 60; // 60-90%
      this.color = `hsla(${hue}, ${sat}%, ${light}%, ${this.opacity})`;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // 缓慢上下浮动
      this.y += Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.3;

      // 边界循环
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;

      // 呼吸效果
      if (this.fading) {
        this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0.1) this.fading = false;
      } else {
        this.opacity += this.fadeSpeed;
        if (this.opacity >= 0.8) this.fading = true;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace(/[\d.]+\)$/, this.opacity + ')');
      ctx.fill();

      // 微弱的 glow 效果
      if (this.opacity > 0.5) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, (this.opacity * 0.3) + ')');
        ctx.fill();
      }
    }
  }

  function init() {
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();
  animate();
})();

/**
 * Framework Switch - Mizuki ↔ Classic site switcher
 * Injects a floating button to switch between Astro (Modern) and Hexo (Classic) versions
 */
(function () {
  'use strict';

  // Detect current framework
  const isClassic = window.location.pathname.startsWith('/classic');
  const isAstro = !isClassic;

  // ========== INJECT SWITCH CSS ==========
  const style = document.createElement('style');
  style.textContent = `
    /* Framework Switch Button */
    .fw-switch-btn {
      position: fixed;
      bottom: 24px;
      right: 180px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 24px;
      border: 1.5px solid var(--primary, #3b82f6);
      background: var(--card-bg, #fff);
      color: var(--text, #333);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      transition: all 0.3s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      text-decoration: none;
      white-space: nowrap;
    }
    .fw-switch-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      border-color: var(--primary, #3b82f6);
      opacity: 0.9;
    }
    .fw-switch-btn .fw-icon {
      font-size: 16px;
      line-height: 1;
    }
    .fw-switch-btn.classic-mode {
      background: var(--card-bg, #1e1e1e);
      border-color: rgba(255,255,255,0.2);
      color: var(--text, #ccc);
    }
    @media (max-width: 768px) {
      .fw-switch-btn {
        right: 16px;
        bottom: 20px;
        padding: 6px 12px;
        font-size: 12px;
        border-radius: 20px;
        gap: 4px;
      }
      .fw-switch-btn .fw-label {
        display: none;
      }
    }
    /* Dark mode for classic site */
    [data-theme="dark"] .fw-switch-btn {
      background: rgba(45,45,45,0.9);
      border-color: rgba(255,255,255,0.2);
      color: #ccc;
    }
  `;
  document.head.appendChild(style);

  // ========== CREATE SWITCH BUTTON ==========
  function createSwitchButton() {
    if (document.getElementById('fw-switch-btn')) return;

    const btn = document.createElement('a');
    btn.id = 'fw-switch-btn';
    btn.className = 'fw-switch-btn' + (isClassic ? ' classic-mode' : '');
    
    if (isClassic) {
      // On Classic site -> go to Modern
      btn.href = '/';
      btn.innerHTML = '<span class="fw-icon">✨</span><span class="fw-label">现代版</span>';
      btn.title = '切换到现代版 Mizuki';
      // Don't open in new tab, just navigate
    } else {
      // On Astro/Modern site -> go to Classic
      btn.href = '/classic/';
      btn.innerHTML = '<span class="fw-icon">📜</span><span class="fw-label">经典版</span>';
      btn.title = '切换到经典版';
    }

    // Save current preference
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      localStorage.setItem('fw-preference', isClassic ? 'modern' : 'classic');
      window.location.href = target;
    });

    document.body.appendChild(btn);
  }

  // ========== ASTRO SITE: Fix classic link behavior ==========
  function fixAstroClassicLinks() {
    if (!isAstro) return;
    // Remove the _blank behavior - allow same-tab navigation to /classic/
    document.querySelectorAll('a[href="/classic"], a[href="/classic/"]').forEach(link => {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });
  }

  // ========== INIT ==========
  function init() {
    createSwitchButton();
    if (isAstro) {
      fixAstroClassicLinks();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run link fixes on Swup page transitions (Astro uses Swup)
  // The navbar/footer classic links are replaced during Swup navigation
  if (typeof window.swup !== 'undefined' && window.swup.hooks) {
    window.swup.hooks.on('content:replace', () => {
      // Small delay to let DOM update
      setTimeout(() => {
        // Re-ensure the switch button exists (may have been in Swup container)
        if (!document.getElementById('fw-switch-btn')) {
          init();
        } else if (isAstro) {
          // Always fix classic links after Swup navigation,
          // since navbar content is replaced
          fixAstroClassicLinks();
        }
      }, 150);
    });
  }

  // Also handle Classic site PJAX (Hexo uses pjax for page transitions)
  document.addEventListener('pjax:complete', () => {
    setTimeout(() => {
      if (!document.getElementById('fw-switch-btn')) {
        createSwitchButton();
      }
    }, 100);
  });
})();

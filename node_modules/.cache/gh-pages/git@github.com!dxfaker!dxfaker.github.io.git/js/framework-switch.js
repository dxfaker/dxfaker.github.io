/**
 * Framework Switch - Mizuki ↔ Classic site switcher
 * On Astro: "经典版" link in navbar Others dropdown (handled by inline script)
 * On Classic: Nothing needed - the navbar/inline script handles switch back
 * This file exists for future enhancements
 */
(function () {
  'use strict';

  // Currently, the classic site switching is handled by:
  // - Astro: inline script in Layout.astro that intercepts /classic/ clicks
  // - Classic: no floating button needed (user switches back via browser nav or manual URL)

  // Clean up any leftover floating buttons from previous versions
  var oldBtns = document.querySelectorAll('.fw-switch-btn');
  for (var i = 0; i < oldBtns.length; i++) {
    oldBtns[i].parentNode && oldBtns[i].parentNode.removeChild(oldBtns[i]);
  }
})();

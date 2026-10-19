'use strict';

// The demo does not authorize users or send initData/profile data to a server.
// These calls only adapt the web interface to the Telegram container.
(() => {
  const tg = window.Telegram?.WebApp;
  const insideTelegram = Boolean(tg?.initData);
  let backHandler = () => {};
  const supported = version => Boolean(tg?.isVersionAtLeast?.(version));
  function safeArea() {
    const system = tg?.safeAreaInset || {};
    const content = tg?.contentSafeAreaInset || {};
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      const value = Math.max(0, Number(system[edge]) || 0) + Math.max(0, Number(content[edge]) || 0);
      document.documentElement.style.setProperty(`--chik-safe-${edge}`, value + 'px');
    }
  }
  if (insideTelegram) {
    document.documentElement.classList.add('inside-telegram');
    tg.ready();
    tg.expand();
    if (supported('6.1')) {
      tg.setHeaderColor(supported('6.9') ? '#f6f6f1' : 'bg_color');
      tg.setBackgroundColor('#f6f6f1');
      tg.BackButton.onClick(() => backHandler());
    }
    if (supported('7.10')) tg.setBottomBarColor('#f6f6f1');
    if (supported('8.0')) {
      safeArea();
      tg.onEvent('safeAreaChanged', safeArea);
      tg.onEvent('contentSafeAreaChanged', safeArea);
    }
  }
  window.ChikTelegram = Object.freeze({
    insideTelegram,
    setBackHandler(handler, visible) {
      backHandler = handler;
      if (insideTelegram && supported('6.1')) {
        if (visible) tg.BackButton.show(); else tg.BackButton.hide();
      }
    },
    success() {
      if (insideTelegram && supported('6.1')) tg.HapticFeedback?.notificationOccurred('success');
    },
    openOrganizer() {
      const url = 'https://t.me/' + window.CHIK_CONFIG.organizerUsername;
      if (insideTelegram && supported('6.1')) tg.openTelegramLink(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
})();

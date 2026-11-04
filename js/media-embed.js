(() => {
  const selector = 'a.markdown-video-preview[data-media-kind]';

  function play(link, { autoplay = true, usePoster = true, focus = true } = {}) {
    const kind = link.dataset.mediaKind;
    if (!['video', 'audio', 'iframe'].includes(kind)) return;
    const href = link.getAttribute('href');
    if (!href) return;
    let source;
    try {
      source = new URL(href, document.baseURI);
    } catch (_) {
      return;
    }
    const localFile = location.protocol === 'file:' && source.protocol === 'file:' && !/^[a-z][a-z0-9+.-]*:/i.test(href);
    if (!['http:', 'https:'].includes(source.protocol) && !localFile) return;
    const cover = link.querySelector('img');
    const label = cover?.alt || '媒体播放器';
    const player = document.createElement(kind);

    if (kind === 'iframe') {
      player.className = 'markdown-media-frame markdown-video-player';
      player.src = source.href;
      player.title = label;
      player.width = '720';
      player.height = '405';
      player.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
    } else {
      player.className = `markdown-media-${kind}${kind === 'video' ? ' markdown-video-player' : ''}`;
      player.controls = true;
      player.preload = autoplay ? 'metadata' : 'auto';
      player.setAttribute('aria-label', label);
      if (kind === 'video') {
        player.playsInline = true;
        if (usePoster && cover?.complete && cover.naturalWidth > 0) player.poster = cover.src;
      }
      const file = document.createElement('source');
      file.src = source.href;
      if (link.dataset.mediaType) file.type = link.dataset.mediaType;
      player.append(file);
    }
    link.replaceWith(player);
    if (focus) player.focus();
    if (autoplay && kind !== 'iframe') {
      const result = player.play();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    }
  }

  document.querySelectorAll(selector).forEach((link) => {
    link.setAttribute('role', 'button');
    const cover = link.querySelector('img');
    const showFirstFrame = () => {
      if (link.isConnected) play(link, { autoplay: false, usePoster: false, focus: false });
    };
    if (!cover?.getAttribute('src')) {
      showFirstFrame();
      return;
    }
    cover.addEventListener('error', showFirstFrame, { once: true });
    if (cover.complete && cover.naturalWidth === 0) showFirstFrame();
  });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.(selector);
    if (!link) return;
    event.preventDefault();
    play(link);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || !event.target.matches?.(selector)) return;
    event.preventDefault();
    play(event.target);
  });
})();

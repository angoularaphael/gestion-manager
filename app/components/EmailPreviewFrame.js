'use client';

import { useEffect, useRef } from 'react';

export default function EmailPreviewFrame({ html, title = 'Aperçu email', minHeight = 360 }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    function resize() {
      try {
        const doc = iframe.contentDocument;
        if (!doc?.documentElement) return;
        const height = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight || 0,
          minHeight
        );
        iframe.style.height = `${height + 24}px`;
      } catch {
        iframe.style.height = `${minHeight}px`;
      }
    }

    iframe.addEventListener('load', resize);
    const timer = window.setTimeout(resize, 80);
    return () => {
      iframe.removeEventListener('load', resize);
      window.clearTimeout(timer);
    };
  }, [html, minHeight]);

  return (
    <iframe
      ref={iframeRef}
      className="email-preview-iframe"
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin"
      scrolling="no"
    />
  );
}

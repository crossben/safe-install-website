'use client';

import { useCallback, useState } from 'react';

/**
 * Copies `text` to the clipboard and confirms inline.
 *
 * Falls back to a hidden textarea + `execCommand` for the browsers where the
 * async clipboard API is unavailable or blocked on an insecure origin, which
 * matters because `http://localhost` counts as insecure in some setups.
 */
export function CopyButton({
  text,
  label = 'Copy',
  className = '',
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied — leave the label unchanged rather than
      // claiming a copy that did not happen.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied to clipboard' : `Copy ${label} to clipboard`}
      className={`inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      <span>
        {copied ? 'Copied' : label}
        {/* Extends the accessible name without altering the visible label,
            which keeps the two in sync for assistive tech. */}
        <span className="sr-only"> to clipboard</span>
      </span>
    </button>
  );
}

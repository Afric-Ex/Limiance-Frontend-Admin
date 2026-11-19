import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

export default function CopyButton({
  text,
  size = 12,
  title = 'Copy to clipboard',
  color = 'var(--text-muted)',
  stopPropagation = false,
  onCopied,
  label,
  copiedLabel = 'Copied',
  style,
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async (e) => {
    if (stopPropagation) e.stopPropagation();
    const ok = await copyTextToClipboard(text);
    if (!ok) return;

    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
    if (onCopied) onCopied(text);
  };

  const activeColor = copied ? 'var(--success-text)' : color;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={copied ? copiedLabel : title}
      aria-label={copied ? copiedLabel : title}
      style={{
        background: 'none',
        border: 'none',
        color: activeColor,
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: label ? '6px' : undefined,
        transition: 'color 0.15s ease',
        ...style,
      }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {label && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Sheet.css';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

/**
 * Sheet — portal-rendered modal overlay.
 *
 * Variants:
 *   - "bottom"      — bottom sheet (slides up from bottom edge)
 *   - "centered"    — centered dialog
 *   - "auto"        — bottom sheet on mobile, centered dialog on desktop (768px breakpoint)
 *   - "drawer-left" — full-height drawer sliding in from the left edge
 *
 * Escapes CSS containing-block traps by rendering to document.body.
 * Handles Escape key, basic focus trap, focus return on close, and backdrop dismiss.
 */
export default function Sheet({
  open,
  onClose,
  variant = 'bottom',
  dismissOnBackdrop = true,
  role = 'dialog',
  ariaLabel,
  ariaLabelledBy,
  children,
}) {
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);

  // Focus first focusable on open; restore focus on close
  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = document.activeElement;
    const id = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
    });
    return () => {
      cancelAnimationFrame(id);
      const prev = lastFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open]);

  // Escape to close + basic focus trap
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll(FOCUSABLE);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`sheet sheet--${variant}`}
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`sheet__panel sheet__panel--${variant}`}
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press
 * @param onEscape - Callback function to execute when ESC is pressed
 * @param enabled - Whether the hook is enabled (default: true)
 */
export const useEscapeKey = (onEscape: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onEscape, enabled]);
};

import { useState, useEffect, useCallback } from 'react';

type UseKeyboardShortcutsOptions = {
  /** IDs of cards the visitor can currently play */
  playableCardIds: string[];
  /** Whether it's the visitor's turn and shortcuts should be active */
  enabled: boolean;
  /** Called when the visitor presses Enter on a selected card */
  onPlayCard: (cardId: string) => void;
  /** Called when the visitor presses Space/D to draw */
  onDrawCard: () => void;
  /** Called when the visitor presses U to call UNO */
  onCallUno: () => void;
  /** Called when the visitor presses Escape */
  onEscape: () => void;
  /** Whether the deck is clickable (draw is allowed) */
  deckEnabled: boolean;
  /** Whether UNO can currently be called */
  unoAvailable: boolean;
};

type UseKeyboardShortcutsReturn = {
  /** Currently keyboard-selected card ID (for visual highlight) */
  selectedCardId: string | null;
  /** Clear the selection (e.g. after a card is played) */
  clearSelection: () => void;
};

export const useKeyboardShortcuts = ({
  playableCardIds,
  enabled,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onEscape,
  deckEnabled,
  unoAvailable,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn => {
  // Store the selected card ID directly — survives playableCardIds reordering
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const count = playableCardIds.length;

  const clearSelection = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          if (count === 0) return;
          setSelectedId((prev) => {
            const idx = prev ? playableCardIds.indexOf(prev) : -1;
            const next = idx <= 0 ? count - 1 : idx - 1;
            return playableCardIds[next];
          });
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (count === 0) return;
          setSelectedId((prev) => {
            const idx = prev ? playableCardIds.indexOf(prev) : -1;
            const next = idx >= count - 1 ? 0 : idx + 1;
            return playableCardIds[next];
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          setSelectedId((prev) => {
            if (prev && playableCardIds.includes(prev)) {
              onPlayCard(prev);
            }
            return null;
          });
          break;
        }
        case ' ':
        case 'd':
        case 'D': {
          if (e.key === ' ') e.preventDefault();
          if (deckEnabled) {
            setSelectedId(null);
            onDrawCard();
          }
          break;
        }
        case 'u':
        case 'U': {
          if (unoAvailable) {
            onCallUno();
          }
          break;
        }
        case 'Escape': {
          onEscape();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, count, playableCardIds, deckEnabled, unoAvailable, onPlayCard, onDrawCard, onCallUno, onEscape]);

  // Only return a valid selection if the card is still playable
  const selectedCardId =
    enabled && selectedId && playableCardIds.includes(selectedId)
      ? selectedId
      : null;

  return { selectedCardId, clearSelection };
};

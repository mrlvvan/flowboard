import { useQueryClient } from "@tanstack/react-query";
import { useCommandHistory } from "./commandHistory";
import { deleteCard, restoreCard, type Card } from "@/features/cards/api/cardsApi";
import { cardKeys } from "@/features/cards/api/keys";

/**
 * Returns reversible operations for cards.  Use these instead of calling
 * the raw mutations directly when you want Ctrl+Z / Ctrl+Shift+Z to work.
 */
export function useCardCommands(boardId: string) {
  const push = useCommandHistory((s) => s.push);
  const qc = useQueryClient();

  const invalidate = () => void qc.invalidateQueries({ queryKey: cardKeys.byBoard(boardId) });

  /** Delete a card, push an undo command that restores the exact snapshot. */
  const deleteCardUndoable = async (card: Card) => {
    // Snapshot is captured by closure at command-creation time
    const snapshot: Card = { ...card };

    await push({
      label: `Delete "${card.title.slice(0, 40)}"`,
      execute: async () => {
        await deleteCard(snapshot.id);
        invalidate();
      },
      undo: async () => {
        await restoreCard(snapshot);
        invalidate();
      },
    });
  };

  return { deleteCardUndoable };
}

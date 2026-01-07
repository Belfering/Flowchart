/**
 * Insert Menu Component
 * Menu for adding new blocks to the flowchart
 * Phase 2: Basic blocks only (advanced blocks in Phase 5)
 */

import { Button } from '@/components/ui/button';
import type { BlockKind, SlotId } from '@/types/flowchart';

export interface InsertMenuProps {
  parentId: string;
  parentSlot: SlotId;
  index: number;
  onAdd: (parentId: string, slot: SlotId, index: number, kind: BlockKind) => void;
  onClose: () => void;
}

export function InsertMenu({ parentId, parentSlot, index, onAdd, onClose }: InsertMenuProps) {
  const handleAdd = (kind: BlockKind) => {
    onAdd(parentId, parentSlot, index, kind);
    onClose();
  };

  return (
    <div
      className="absolute z-10 bg-surface border border-border rounded-lg shadow-lg p-2 space-y-1 min-w-[150px]"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        className="w-full justify-start text-sm"
        onClick={() => handleAdd('indicator')}
      >
        📊 Indicator (If/Else)
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-sm"
        onClick={() => handleAdd('position')}
      >
        🎯 Position (Ticker)
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-sm"
        onClick={() => handleAdd('basic')}
      >
        ⚖️ Basic (Weighted)
      </Button>

      {/* Phase 5: Add advanced block types */}
      {/* <Button onClick={() => handleAdd('numbered')}>Numbered (Any/All)</Button> */}
      {/* <Button onClick={() => handleAdd('function')}>Function (Filtered)</Button> */}
      {/* <Button onClick={() => handleAdd('altExit')}>Alt Exit (Enter/Exit)</Button> */}
      {/* <Button onClick={() => handleAdd('scaling')}>Scaling (Mixed)</Button> */}

      <div className="border-t border-border my-1" />
      <Button variant="ghost" className="w-full justify-start text-sm text-muted-foreground" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

/**
 * Flowchart Toolbar Component
 * Phase 2: Undo/redo, collapse controls, clear flowchart
 */

import { Button } from '@/components/ui/button';
import { useFlowchartStore, useFlowchartUndo } from '@/stores/useFlowchartStore';
import { createDefaultRoot } from '@/lib/flowchart/helpers';

export function FlowchartToolbar() {
  const { undo, redo, canUndo, canRedo, clear } = useFlowchartUndo();
  const setRoot = useFlowchartStore((state) => state.setRoot);
  const collapseAll = useFlowchartStore((state) => state.collapseAll);

  const handleClear = () => {
    if (confirm('Clear the entire flowchart? This cannot be undone.')) {
      clear();
      setRoot(createDefaultRoot());
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-surface border-b border-border">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </Button>
      </div>

      <div className="border-l border-border h-6 mx-1" />

      {/* Collapse/Expand */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => collapseAll(true)}
          title="Collapse all nodes"
        >
          ▼ Collapse All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => collapseAll(false)}
          title="Expand all nodes"
        >
          ▶ Expand All
        </Button>
      </div>

      <div className="border-l border-border h-6 mx-1" />

      {/* Clear */}
      <Button variant="destructive" size="sm" onClick={handleClear}>
        🗑️ Clear Flowchart
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        {canUndo ? `${useFlowchartStore.temporal.getState().pastStates.length} changes` : 'No changes'}
      </div>
    </div>
  );
}

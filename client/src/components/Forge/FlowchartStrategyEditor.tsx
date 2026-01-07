/**
 * Flowchart Strategy Editor
 * Phase 2: Visual flowchart builder with interactive editing
 */

import { Card } from '@/components/ui/card';
import { useFlowchartStore } from '@/stores/useFlowchartStore';
import { FlowchartToolbar } from '@/components/Flowchart/FlowchartToolbar';
import { InteractiveNodeCard } from '@/components/Flowchart/NodeCard/InteractiveNodeCard';

export function FlowchartStrategyEditor() {
  const root = useFlowchartStore((state) => state.root);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="overflow-hidden">
        <FlowchartToolbar />
      </Card>

      {/* Flowchart Canvas */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Strategy Flowchart</h3>
          <p className="text-sm text-muted-foreground">
            Build your strategy visually. Parameters will be automatically extracted.
          </p>
        </div>

        {/* Render the flowchart tree */}
        <div className="bg-muted/20 rounded-lg p-4 overflow-auto max-h-[600px]">
          <InteractiveNodeCard node={root} />
        </div>
      </Card>

      {/* Phase 3: Parameter Extraction Panel will go here */}
      {/* <ParameterExtractionPanel /> */}

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950">
        <h4 className="font-semibold mb-2">💡 How to use:</h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Click "+ Add Block" to insert new strategy blocks</li>
          <li>Click on any block title to rename it</li>
          <li>For Indicator blocks, edit conditions using the dropdowns</li>
          <li>Use "+ AND" / "+ OR" to add multiple conditions</li>
          <li>Click the × button to delete nodes or conditions</li>
          <li>Use Undo/Redo buttons if you make a mistake</li>
        </ul>
      </Card>
    </div>
  );
}

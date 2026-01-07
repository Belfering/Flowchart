/**
 * Flowchart Strategy Editor
 * Phase 3: Visual flowchart builder with parameter extraction
 */

import { Card } from '@/components/ui/card';
import { useFlowchartStore } from '@/stores/useFlowchartStore';
import { FlowchartToolbar } from '@/components/Flowchart/FlowchartToolbar';
import { InteractiveNodeCard } from '@/components/Flowchart/NodeCard/InteractiveNodeCard';
import { ParameterExtractionPanel } from './ParameterExtractionPanel';
import { useParameterExtraction } from '@/hooks/useParameterExtraction';
import { useFlowchartEstimate } from '@/hooks/useFlowchartEstimate';
import { useFlowchartPersistence } from '@/hooks/useFlowchartPersistence';
import type { ForgeConfig } from '@/types/forge';
import type { ParameterRange } from '@/types/flowchart';
import { useEffect } from 'react';

interface FlowchartStrategyEditorProps {
  config: ForgeConfig;
  updateConfig: (updates: Partial<ForgeConfig>) => void;
}

export function FlowchartStrategyEditor({ config, updateConfig }: FlowchartStrategyEditorProps) {
  const root = useFlowchartStore((state) => state.root);

  // Persist flowchart to localStorage
  useFlowchartPersistence(config, updateConfig);

  // Extract parameters from flowchart
  const extractedParameters = useParameterExtraction(root);

  // Sync extracted parameters with config (initialize parameterRanges if needed)
  useEffect(() => {
    if (extractedParameters.length > 0 && !config.parameterRanges) {
      updateConfig({ parameterRanges: extractedParameters });
    }
  }, [extractedParameters, config.parameterRanges, updateConfig]);

  // Use parameterRanges from config, or fallback to extracted
  const parameterRanges = config.parameterRanges || extractedParameters;

  // Calculate branch estimate
  const estimate = useFlowchartEstimate(parameterRanges, config.tickers.length);

  // Update a specific parameter
  const handleUpdateParameter = (id: string, updates: Partial<ParameterRange>) => {
    const updatedRanges = parameterRanges.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    updateConfig({ parameterRanges: updatedRanges });
  };

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

      {/* Parameter Extraction Panel */}
      <ParameterExtractionPanel
        parameters={parameterRanges}
        onUpdateParameter={handleUpdateParameter}
        branchCount={estimate?.totalBranches || 1}
      />

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

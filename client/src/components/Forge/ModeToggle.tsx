/**
 * Mode Toggle Component
 * Switches between Simple and Flowchart modes
 * Phase 2: Radio button or tab-based toggle
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModeToggleProps {
  mode: 'simple' | 'flowchart';
  onChange: (mode: 'simple' | 'flowchart') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-sm font-semibold text-muted-foreground">Strategy Mode:</span>
      <Tabs value={mode} onValueChange={(value) => onChange(value as 'simple' | 'flowchart')}>
        <TabsList>
          <TabsTrigger value="simple">
            📊 Simple Mode
          </TabsTrigger>
          <TabsTrigger value="flowchart">
            🌳 Flowchart Builder
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <span className="text-xs text-muted-foreground">
        {mode === 'simple'
          ? 'Single indicator with period/threshold ranges'
          : 'Visual strategy builder with automatic parameter extraction'}
      </span>
    </div>
  );
}

# PRD 003 – Conditional Logic Validation (AND/IF, OR/IF)

## Metadata
- ID: 003
- Title: Conditional logic validation (AND/IF, OR/IF)
- Status: draft
- Owner:
- Depends on: backtesting engine integration (implemented)
- Created: 2025-12-15
- Last updated: 2025-12-17

## Summary
Ensure Build tab strategies execute AND/IF and OR/IF conditions correctly. Add validation and testing to confirm conditional branches evaluate as intended in trading logic and backtests.

## Goals
- Guarantee AND/IF and OR/IF nodes/conditions in the Build tab evaluate accurately during strategy execution.
- Provide confidence via targeted tests/backtest fixtures.

## Non-goals
- Redesigning the node palette or adding new condition types.

## UX / UI
- No major UI changes; add inline validation states or warnings if a condition is misconfigured (e.g., missing operands).
- Debug/inspect: optional simple log or tooltip showing evaluated truth state per condition during test/backtest runs.

## Data Model / State
- Conditions should explicitly store operator type (AND vs OR) and operands to avoid ambiguity during serialization/deserialization.

## Acceptance Criteria
- Backtests execute AND/IF and OR/IF correctly (AND requires all operands true; OR requires any true) for saved strategies.
- Mixed AND/OR uses standard boolean precedence (AND before OR): e.g., `A OR B AND C` evaluates as `A OR (B AND C)`.
- Existing and newly saved bots preserve operator type and operands and reload without changing logic.
- Add automated tests/fixtures covering:
  - AND with mixed true/false branches.
  - OR with mixed true/false branches.
  - Nested combinations (AND containing OR, OR containing AND) to verify short-circuit/ordering if applicable.
- Provide a simple way to verify evaluation results (e.g., debug overlay/log or test output) during development.

## Open Questions
- Should conditions short-circuit, or always evaluate all operands? (default: short-circuit for performance unless side-effects require full eval).
- Do we need UI-level indicators of the last-evaluated state per node in the canvas?

## Implementation Notes / Recommended UI & Libraries
- Make operator explicit in the node schema and runtime execution.
- Add unit/integration tests around the condition evaluator using representative strategies.
- Consider surfacing a dev-mode overlay or console trace for condition evaluation when running local dev builds.

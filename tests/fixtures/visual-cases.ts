// Frozen reviewer-only descriptions. These facts never appear in MCP tool metadata.
export const visualCases = [
  { id: 'V01', content: 'A → B → C, clearly labeled', question: 'Describe this flow', facts: 'Three nodes in that direction' },
  { id: 'V02', content: 'A → B and A → C', question: 'Compare the branches', facts: 'Two outgoing branches from A' },
  { id: 'V03', content: 'A → B; timeout written beside B', question: 'Suggest failure handling', facts: 'Timeout is a note; any new handler is a proposal' },
  { id: 'V04', content: 'Login → profile; no return arrow', question: 'What could be missing?', facts: 'No drawn return path; suggested recovery is inferred' },
  { id: 'V05', content: 'Client → API → DB; DB crossed out', question: 'Discuss a failure risk', facts: 'Database visibly crossed out; meaning uncertain' },
  { id: 'V06', content: 'Separate unconnected boxes A and B', question: 'Explain the relationship', facts: 'No visible connector; do not invent one as fact' },
  { id: 'V07', content: 'Box labeled pay? with a fuzzy final letter', question: 'What does this step mean?', facts: 'Label ambiguity must be acknowledged' },
  { id: 'V08', content: 'A ↔ B as two opposing arrows', question: 'Explain directionality', facts: 'Both directions visibly present' },
  { id: 'V09', content: 'A → B selected; unrelated C entirely outside', question: 'What is shared?', facts: 'Only A and B may inform the answer' },
  { id: 'V10', content: 'Retry loop around a worker; no numeric limit', question: 'Is retry bounded?', facts: 'Loop exists; no limit is specified' },
] as const;

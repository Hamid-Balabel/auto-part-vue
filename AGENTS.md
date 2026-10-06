<!-- BEGIN GLOBAL MULTI-AGENT DELEGATION -->
## Mandatory Global Multi-Agent Delegation

- `orchestrator` (`openai/gpt-5.6-sol`) is the primary architect and final validator.
- All repository exploration and context gathering MUST be delegated to `explorer-free` (`opencode/mimo-v2.5-free`).
- All exact, repetitive, mechanical, low-risk implementation MUST be delegated to `cheap-coder` (`opencode/nemotron-3.5-lightning-free`).
- Architecturally understood medium-complexity implementation goes to `developer` (`openai/gpt-5.5`).
- Important independent read-only review goes to `reviewer` (`openai/gpt-5.5`).
- The orchestrator retains architecture, ambiguity, complex business logic, security, concurrency, data integrity, difficult debugging, cross-module decisions, conflict resolution, and final validation.
- Workers must avoid unrelated changes, preserve compatibility, add no unrequested dependencies, and never commit or push unless explicitly requested.
<!-- END GLOBAL MULTI-AGENT DELEGATION -->

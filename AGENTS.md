# Agent Configuration

This file configures AI agents to follow all rules and guidelines from the main project documentation.

## Core Rules

**CRITICAL**: All agents MUST read and follow the complete rules in:

@CLAUDE.md

## Key Guidelines Summary

The CLAUDE.md file contains comprehensive rules for:

### 1. Project Structure
- Monorepo architecture with Bun workspaces
- Package organization (@zomme/frame, frame-react, frame-vue, frame-angular)
- Application structure (shell-angular, shell-vue, app-* micro-frontends)

### 2. Development Workflow
- **ALWAYS** create execution plans for non-trivial tasks (3+ steps)
- **ALWAYS** create feature/fix branches (never work directly on main)
- **Execute phase by phase** with test validation after each phase
- **Commit after each phase** with meaningful commit messages
- **NEVER merge or push** without explicit user permission

### 3. Communication Architecture
- PostMessage-based iframe communication
- Props synchronization (including RPC function serialization)
- Bidirectional event system
- Watch API for reactive updates

### 4. Development Commands
- `bun run dev` - Watch mode (auto-rebuild, no manual builds needed)
- `bun run build` - Production builds only
- `bun test` - Run tests (required before completing each phase)

### 5. Important Constraints
- Use arrow functions in services to preserve `this`
- Declare workspace dependencies with `workspace:*`
- **NEVER** create commits without explicit user permission
- **NEVER** merge or push without explicit authorization

## Implementation Process

When implementing features or bugfixes:

1. ✅ Create execution plan document (if task has 3+ steps)
2. ✅ Create feature/fix branch
3. ✅ Execute phase by phase
4. ✅ Run tests after each phase (`bun test`)
5. ✅ Commit after each successful phase
6. ✅ **ASK USER** before merge/push

## Testing Requirements

- All tests must pass before marking phase as complete
- If tests fail, fix issues before proceeding to next phase
- Verify build works: `bun run build`
- Manual testing in browser when applicable

---

**Note:** This file serves as a pointer to CLAUDE.md. Always refer to CLAUDE.md for the complete, authoritative set of rules and guidelines.

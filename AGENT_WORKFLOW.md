# Agent Workflow Documentation

This document outlines the systematic approach I'll be taking when responding to your requests. The goal is to ensure consistent, high-quality responses that leverage the codebase context and MCP servers without requiring explicit prompting.

## Core Principles

### 1. Codebase-First Approach

For every request, I will:
- Examine the codebase structure first
- Search for relevant files and code patterns
- Read key files to understand implementation details
- Map dependencies and relationships between components

This ensures all responses are grounded in the actual codebase rather than assumptions.

### 2. Automatic MCP Server Integration

I will automatically use appropriate MCP servers based on the task:

| Task Type | MCP Tools |
|-----------|-----------|
| GitHub operations | `mcp_GitHub_*` tools |
| Browser testing | `mcp_Browser_Tools_*` and `mcp_Puppet_*` tools |
| UI components | `mcp_UI_21st_magic_component_builder` |
| Complex reasoning | `mcp_Sequential_Thinking_sequentialthinking` |

### 3. Implementation Workflow

For each task, I'll follow this workflow:
1. **Analyze**: Understand requirements and context
2. **Explore**: Examine relevant codebase sections
3. **Plan**: Develop an approach based on existing patterns
4. **Implement**: Use appropriate tools to make changes
5. **Verify**: Test changes when possible

## Reference Files

Two reference files have been created to guide this approach:

1. `agent-workflow.js`: High-level workflow guidelines
2. `agent-helper.js`: Practical implementation details

These files serve as a reference for me and are not meant to be executed directly.

## Usage

You can now simply describe what you need, and I'll automatically:
1. Reference the codebase first
2. Use appropriate MCP servers
3. Follow a systematic approach to implementation

No need to explicitly prompt for these behaviors - they're now built into my workflow. 
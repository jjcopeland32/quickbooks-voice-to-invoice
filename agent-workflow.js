/**
 * Agent Workflow Guidelines
 * 
 * This file serves as a reference for the systematic approach to handling tasks:
 * 
 * 1. CODEBASE FIRST APPROACH
 *    - Always examine relevant parts of the codebase before taking action
 *    - Use codebase_search, grep_search, and read_file to understand context
 *    - Map dependencies and relationships between components
 * 
 * 2. MCP SERVER INTEGRATION
 *    - For GitHub operations: use mcp_GitHub_* tools automatically
 *    - For browser testing: use mcp_Browser_Tools_* and mcp_Puppet_* tools
 *    - For UI components: leverage mcp_UI_21st_magic_component_builder
 * 
 * 3. SEQUENTIAL THINKING
 *    - Use mcp_Sequential_Thinking_sequentialthinking for complex problems
 *    - Break down tasks into logical steps before implementation
 * 
 * 4. IMPLEMENTATION WORKFLOW
 *    - Analyze requirements
 *    - Explore existing codebase for context and patterns
 *    - Plan changes with consideration for existing architecture
 *    - Implement changes using appropriate tools
 *    - Test changes when possible
 * 
 * This approach ensures consistent, context-aware responses that leverage
 * available tools without requiring explicit prompting.
 */

// Example workflow function (for reference only)
async function handleTask(task) {
  // 1. Analyze codebase context first
  await exploreCodebase(task);
  
  // 2. Plan approach
  const plan = await createPlan(task);
  
  // 3. Execute with appropriate MCP tools
  await executeWithMCPTools(plan);
  
  // 4. Verify results
  await verifyResults();
}

// This file serves as a reference and is not meant to be executed directly 
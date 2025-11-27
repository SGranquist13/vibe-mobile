import type { AgentDefinition } from '@/types/providerSettings';

/**
 * Parse agent markdown file from awesome-claude-code-subagents format
 * 
 * Format:
 * ---
 * name: agent-name
 * description: When this agent should be invoked
 * tools: Read, Write, Edit, Bash, Glob, Grep
 * ---
 * 
 * You are a [role description]...
 */
export function parseAgentMarkdown(content: string): Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'> | null {
    try {
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
        if (!frontmatterMatch) {
            // Try without frontmatter - might be just the content
            return {
                name: 'imported-agent',
                description: 'Imported agent',
                tools: [],
                systemPrompt: content.trim(),
                source: 'imported',
                provider: 'all',
            };
        }

        const [, frontmatter, body] = frontmatterMatch;

        // Parse frontmatter
        const frontmatterLines = frontmatter.split('\n');
        const metadata: Record<string, string> = {};

        for (const line of frontmatterLines) {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const [, key, value] = match;
                metadata[key.trim()] = value.trim();
            }
        }

        // Extract name
        const name = metadata.name || 'imported-agent';
        
        // Extract description
        const description = metadata.description || 'Imported agent';

        // Extract tools
        const toolsStr = metadata.tools || '';
        const tools = toolsStr
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        // Extract system prompt from body
        const systemPrompt = body.trim();

        // Determine provider (if specified)
        const providerStr = metadata.provider?.toLowerCase() || 'all';
        const provider = ['claude', 'codex', 'gemini', 'cursor', 'all'].includes(providerStr)
            ? (providerStr as 'claude' | 'codex' | 'gemini' | 'cursor' | 'all')
            : 'all';

        // Extract category if available
        const category = metadata.category?.trim() || undefined;

        return {
            name,
            description,
            tools,
            systemPrompt,
            source: 'imported',
            provider,
            category,
        };
    } catch (error) {
        console.error('Failed to parse agent markdown:', error);
        return null;
    }
}

/**
 * Validate agent definition
 */
export function validateAgent(agent: Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!agent.name || agent.name.trim().length === 0) {
        errors.push('Agent name is required');
    }

    if (!agent.description || agent.description.trim().length === 0) {
        errors.push('Agent description is required');
    }

    if (!agent.systemPrompt || agent.systemPrompt.trim().length === 0) {
        errors.push('Agent system prompt is required');
    }

    if (!Array.isArray(agent.tools)) {
        errors.push('Agent tools must be an array');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}



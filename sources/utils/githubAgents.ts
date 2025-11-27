import { parseAgentMarkdown, validateAgent } from './agentParser';
import type { AgentDefinition } from '@/types/providerSettings';

const GITHUB_REPO = 'VoltAgent/awesome-claude-code-subagents';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

export interface GitHubAgentInfo {
    name: string;
    path: string;
    category?: string;
    url: string;
}

/**
 * Fetch list of agents from awesome-claude-code-subagents repository
 */
export async function fetchAgentList(): Promise<GitHubAgentInfo[]> {
    try {
        // Fetch the categories directory structure
        const categoriesResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/categories`);
        
        if (!categoriesResponse.ok) {
            throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
        }

        const categories = await categoriesResponse.json() as Array<{ name: string; path: string; type: string }>;
        const agents: GitHubAgentInfo[] = [];

        // Fetch agents from each category
        for (const category of categories) {
            if (category.type !== 'dir') continue;

            try {
                const categoryResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${category.path}`);
                if (!categoryResponse.ok) continue;

                const categoryFiles = await categoryResponse.json() as Array<{ name: string; path: string; type: string }>;
                
                for (const file of categoryFiles) {
                    if (file.type === 'file' && file.name.endsWith('.md')) {
                        const agentName = file.name.replace('.md', '');
                        agents.push({
                            name: agentName,
                            path: file.path,
                            category: category.name,
                            url: `${GITHUB_RAW_BASE}/${GITHUB_REPO}/main/${file.path}`,
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch category ${category.name}:`, error);
                // Continue with other categories
            }
        }

        return agents;
    } catch (error) {
        console.error('Failed to fetch agent list:', error);
        throw error;
    }
}

/**
 * Fetch agent content from GitHub
 */
export async function fetchAgentContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch agent: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Failed to fetch agent content:', error);
        throw error;
    }
}

/**
 * Import agent from GitHub URL
 */
export async function importAgentFromGitHub(url: string): Promise<Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'> | null> {
    try {
        const content = await fetchAgentContent(url);
        const agent = parseAgentMarkdown(content);
        
        if (!agent) {
            return null;
        }

        // Validate agent
        const validation = validateAgent(agent);
        if (!validation.valid) {
            throw new Error(`Invalid agent: ${validation.errors.join(', ')}`);
        }

        return agent;
    } catch (error) {
        console.error('Failed to import agent from GitHub:', error);
        throw error;
    }
}

/**
 * Search agents by name or category
 */
export function searchAgents(agents: GitHubAgentInfo[], query: string): GitHubAgentInfo[] {
    const lowerQuery = query.toLowerCase();
    return agents.filter(agent => {
        return (
            agent.name.toLowerCase().includes(lowerQuery) ||
            agent.category?.toLowerCase().includes(lowerQuery) ||
            agent.path.toLowerCase().includes(lowerQuery)
        );
    });
}

/**
 * Group agents by category
 */
export function groupAgentsByCategory(agents: GitHubAgentInfo[]): Record<string, GitHubAgentInfo[]> {
    const grouped: Record<string, GitHubAgentInfo[]> = {};
    
    for (const agent of agents) {
        const category = agent.category || 'Other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(agent);
    }
    
    return grouped;
}



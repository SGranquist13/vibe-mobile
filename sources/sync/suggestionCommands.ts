/**
 * Suggestion commands functionality for slash commands
 * Reads commands directly from session metadata storage
 */

import Fuse from 'fuse.js';
import { storage } from './storage';

export interface CommandItem {
    command: string;        // The command without slash (e.g., "compact")
    description?: string;   // Optional description of what the command does
}

interface SearchOptions {
    limit?: number;
    threshold?: number;
}

// Commands to ignore/filter out
// Only CLI/terminal-specific commands that aren't relevant for mobile use
export const IGNORED_COMMANDS = [
    "exit",              // exits CLI process (not applicable to mobile)
    "login",             // mobile handles auth via QR code
    "logout",            // mobile handles auth differently
    "terminal-setup",    // terminal-specific setup
    "vim",               // vim-specific editor commands
    "statusline",        // terminal UI component
    "bashes",            // terminal-specific bash management
    "ide",               // IDE-specific commands
    "install-github-app", // installation command
    "migrate-installer",   // installation/migration command
    "upgrade"            // CLI upgrade command
];

// Default commands always available
const DEFAULT_COMMANDS: CommandItem[] = [
    { command: 'compact', description: 'Compact the conversation history' },
    { command: 'clear', description: 'Clear the conversation' }
];

// Fallback commands for Claude Code sessions (available even if metadata extraction hasn't completed)
// These are common commands that Claude Code typically supports
const CLAUDE_FALLBACK_COMMANDS: CommandItem[] = [
    { command: 'help', description: 'Show available commands' },
    { command: 'export', description: 'Export conversation' },
    { command: 'model', description: 'Change AI model' },
    { command: 'memory', description: 'Manage conversation memory' },
    { command: 'cost', description: 'Show usage cost information' },
    { command: 'status', description: 'Show session status' },
    { command: 'review', description: 'Code review' },
    { command: 'security-review', description: 'Security review' },
    { command: 'bug', description: 'Report or analyze bugs' },
    { command: 'pr-comments', description: 'Generate PR comments' },
    { command: 'config', description: 'Configure Claude Code settings' },
    { command: 'settings', description: 'Manage settings' },
    { command: 'mcp', description: 'Manage MCP servers' },
    { command: 'permissions', description: 'Manage permissions' },
    { command: 'doctor', description: 'Run diagnostics' },
    { command: 'init', description: 'Initialize project' },
    { command: 'add-dir', description: 'Add directory to project' },
    { command: 'agents', description: 'Manage AI agents' },
    { command: 'release-notes', description: 'Show release notes' },
    { command: 'resume', description: 'Resume previous session' },
    { command: 'hooks', description: 'Manage git hooks' },
];

// Command descriptions for known tools/commands
const COMMAND_DESCRIPTIONS: Record<string, string> = {
    // Default commands
    compact: 'Compact the conversation history',
    clear: 'Clear the conversation',
    
    // Common tool commands
    help: 'Show available commands',
    reset: 'Reset the session',
    export: 'Export conversation',
    debug: 'Show debug information',
    status: 'Show session status',
    stop: 'Stop current operation',
    abort: 'Abort current operation',
    cancel: 'Cancel current operation',
    
    // Newly enabled commands
    'add-dir': 'Add directory to project',
    agents: 'Manage AI agents',
    config: 'Configure Claude Code settings',
    settings: 'Manage settings',
    cost: 'Show usage cost information',
    doctor: 'Run diagnostics',
    init: 'Initialize project',
    mcp: 'Manage MCP servers',
    memory: 'Manage conversation memory',
    model: 'Change AI model',
    'pr-comments': 'Generate PR comments',
    'release-notes': 'Show release notes',
    resume: 'Resume previous session',
    bug: 'Report or analyze bugs',
    review: 'Code review',
    'security-review': 'Security review',
    permissions: 'Manage permissions',
    hooks: 'Manage git hooks',
};

// Get commands from session metadata
function getCommandsFromSession(sessionId: string): CommandItem[] {
    const state = storage.getState();
    const session = state.sessions[sessionId];
    if (!session || !session.metadata) {
        return DEFAULT_COMMANDS;
    }

    const commands: CommandItem[] = [...DEFAULT_COMMANDS];
    
    // For Claude Code sessions, add fallback commands if metadata hasn't been populated yet
    const isClaudeSession = session.metadata.flavor === 'claude';
    const hasSlashCommands = session.metadata.slashCommands && session.metadata.slashCommands.length > 0;
    
    if (isClaudeSession && !hasSlashCommands) {
        // Metadata extraction hasn't completed yet, use fallback commands
        for (const fallbackCmd of CLAUDE_FALLBACK_COMMANDS) {
            if (!commands.find(c => c.command === fallbackCmd.command)) {
                commands.push(fallbackCmd);
            }
        }
    }
    
    // Add commands from metadata.slashCommands (filter with ignore list)
    if (session.metadata.slashCommands) {
        for (const cmd of session.metadata.slashCommands) {
            // Skip if in ignore list
            if (IGNORED_COMMANDS.includes(cmd)) continue;
            
            // Check if it's already in default commands or fallback commands
            if (!commands.find(c => c.command === cmd)) {
                commands.push({
                    command: cmd,
                    description: COMMAND_DESCRIPTIONS[cmd] || CLAUDE_FALLBACK_COMMANDS.find(f => f.command === cmd)?.description  // Use description from COMMAND_DESCRIPTIONS or fallback
                });
            }
        }
    }
    
    return commands;
}

// Main export: search commands with fuzzy matching
export async function searchCommands(
    sessionId: string,
    query: string,
    options: SearchOptions = {}
): Promise<CommandItem[]> {
    const { limit = 10, threshold = 0.3 } = options;
    
    // Get commands from session metadata (no caching)
    const commands = getCommandsFromSession(sessionId);
    
    // If query is empty, return all commands
    if (!query || query.trim().length === 0) {
        return commands.slice(0, limit);
    }
    
    // Setup Fuse for fuzzy search
    const fuseOptions = {
        keys: [
            { name: 'command', weight: 0.7 },
            { name: 'description', weight: 0.3 }
        ],
        threshold,
        includeScore: true,
        shouldSort: true,
        minMatchCharLength: 1,
        ignoreLocation: true,
        useExtendedSearch: true
    };
    
    const fuse = new Fuse(commands, fuseOptions);
    const results = fuse.search(query, { limit });
    
    return results.map(result => result.item);
}

// Get all available commands for a session
export function getAllCommands(sessionId: string): CommandItem[] {
    return getCommandsFromSession(sessionId);
}
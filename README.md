# Prism - AI-Native Code Intelligence Platform

> Multi-LLM orchestration with conflict-free concurrent development using Git worktrees.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/zapabob/prism)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- 🤖 **Multi-AI Orchestration**: Run unlimited AI instances in parallel (Codex, Gemini, Claude, GPT-4, Claude 3)
- 🌳 **Git Worktree Integration**: Conflict-free concurrent development with automatic worktree management
- 🎯 **Blueprint System**: Define and execute complex multi-step workflows
- 📊 **3D Git Visualization**: Kamui4d-inspired real-time 3D repository visualization
- 🔔 **Webhook System**: Event-driven integrations with external systems
- 🖥️ **AI-Native OS**: Kernel-level optimizations for AI workloads (Linux + Windows)
- 🔌 **10+ MCP Servers**: Extensible architecture with Model Context Protocol
- 🗳️ **Consensus Engine**: Voting and scoring system for multi-AI results

## 🚀 Quick Start

```bash
# Install Prism CLI
npm install -g @prism/cli

# Initialize in your project
prism init

# Launch multiple AIs in competition mode
prism orchestrate --mode competition --task "Implement JWT authentication"

# Execute a blueprint
prism blueprint execute ./workflows/auth-flow.json

# Start 3D visualization server
prism visualize --port 3000
```

## 📦 Architecture

Prism is a Turborepo monorepo with the following structure:

```
prism/
├── apps/
│   ├── web/              # Next.js 15 Dashboard
│   ├── desktop/          # Electron Desktop App
│   └── cli/              # CLI Tool
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── git-core/         # Git Worktree + Orchestrated Edit
│   ├── supervisor/       # AI Orchestration Engine
│   ├── consensus/        # Voting & Scoring
│   ├── mcp-clients/      # MCP Client集約
│   ├── blueprint/        # Blueprint処理
│   └── webhook/          # Webhook処理
├── mcp-servers/          # 10+ MCP Servers (Rust + TypeScript)
└── kernel-extensions/    # AI-Native OS (Linux + Windows)
```

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/zapabob/prism.git
cd prism

# Install dependencies
npm install

# Start development servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

## 📚 Documentation

- [Architecture](./docs/architecture/README.md)
- [API Reference](./docs/api/README.md)
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Blueprint System](./docs/guides/blueprints.md)
- [MCP Integration](./docs/guides/mcp-configuration.md)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT © [zapabob](https://github.com/zapabob)

## 🙏 Acknowledgments

Based on [OpenAI Codex](https://github.com/openai/codex) best practices and inspired by:
- Kamui4d for 3D Git visualization
- Model Context Protocol (MCP) for AI integration
- Turborepo for monorepo management

## 🔗 Links

- [GitHub Repository](https://github.com/zapabob/prism)
- [Documentation](https://zapabob.github.io/prism)
- [Issues](https://github.com/zapabob/prism/issues)
- [Discussions](https://github.com/zapabob/prism/discussions)

---

**Built with ❤️ by zapabob**


# Contributing / 贡献指南

Thank you for helping improve Organization Diagnosis Workbench. We welcome reproducible bug reports, focused feature proposals, documentation fixes, tests, and small pull requests.

感谢你帮助改进组织诊断工作台。我们欢迎可复现的缺陷、聚焦的功能建议、文档修正、测试和小型 Pull Request。

## English

### Before opening an issue

1. Search existing issues to avoid duplicates.
2. Remove personal, HR-sensitive, credential, or production data from examples.
3. Include the expected behavior, actual behavior, reproduction steps, and environment.

Security vulnerabilities must follow [SECURITY.md](SECURITY.md), not public issues.

### Development workflow

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

Before submitting a pull request:

```bash
pnpm check
```

- Keep changes focused and explain the user impact.
- Add or update tests for behavior changes.
- Update both English and Chinese documentation when user-facing behavior changes.
- Never commit API keys, HR records, local databases, or generated build output.
- AI-generated code is welcome, but the contributor remains responsible for reviewing, testing, and explaining it.

Maintainers may request smaller commits, additional tests, or a design discussion before merging. Final merge and release decisions are always made by a human maintainer.

## 中文

### 提交 Issue 前

1. 搜索已有 Issue，避免重复。
2. 从示例中删除个人信息、HR 敏感信息、密钥和生产数据。
3. 提供期望行为、实际行为、复现步骤与运行环境。

安全漏洞请按照 [SECURITY.md](SECURITY.md#中文) 私下报告，不要创建公开 Issue。

### 开发流程

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
pnpm check
```

- 每个改动应保持聚焦，并说明对用户的影响。
- 行为变化需要新增或更新测试。
- 用户可见行为变化时，应同步更新中英文文档。
- 不得提交 API 密钥、HR 记录、本地数据库或构建产物。
- 可以使用 AI 辅助编码，但贡献者必须自行复核、测试并能够解释改动。

维护者可能要求缩小改动范围、补充测试或先进行设计讨论。最终合并与发布决定始终由人工维护者完成。

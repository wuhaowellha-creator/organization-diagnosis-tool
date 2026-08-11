# Security Policy / 安全政策

## English

### Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting when it is enabled; otherwise contact the maintainer through the GitHub profile at [@wuhaowellha-creator](https://github.com/wuhaowellha-creator) and request a private channel. Include impact, affected versions, reproduction details, and a proposed mitigation when available.

The maintainer will acknowledge a complete report within seven days and coordinate disclosure after a fix is available. No guaranteed response or remediation timeline is offered for this early-stage project.

### Deployment guidance

- Treat HR records and diagnosis content as sensitive organizational data.
- Use synthetic data in development, demonstrations, screenshots, and issues.
- Keep provider keys in server-side environment variables whenever possible.
- Browser-local keys are stored in `localStorage`; use them only on trusted personal devices and clear them after use on shared devices.
- Use HTTPS for every external AI endpoint and restrict production access to intended users.
- Review data-retention, employment, privacy, and compliance requirements before production use.

This software is not a substitute for professional HR, legal, security, or privacy review.

## 中文

### 报告漏洞

发现疑似漏洞时，请勿创建公开 Issue。优先使用 GitHub 的私密漏洞报告；如尚未启用，请通过 [@wuhaowellha-creator](https://github.com/wuhaowellha-creator) 的 GitHub 主页联系维护者并申请私下沟通渠道。请说明影响范围、受影响版本、复现方式和可行的缓解建议。

维护者会尽量在收到完整报告后的七天内确认，并在修复可用后协调披露。项目目前处于早期阶段，不承诺固定响应或修复时限。

### 部署建议

- 将 HR 记录和诊断内容视为组织敏感数据。
- 开发、演示、截图和 Issue 中只使用合成数据。
- 优先通过服务端环境变量保存模型密钥。
- 浏览器密钥保存在 `localStorage`，只能在可信个人设备上使用；共享设备使用后应及时清除。
- 外部 AI 接口必须使用 HTTPS，生产环境应限制为预期用户访问。
- 正式使用前应自行评估数据留存、劳动用工、隐私和合规要求。

本软件不能替代专业的人力资源、法律、安全或隐私审查。

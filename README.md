# 智记 (ZhiNote) — AI 智能笔记知识库

> 和自己的知识库聊天：创建笔记、标签分类，并通过 AI 针对你的笔记提问与总结。

## 功能清单

- 用户注册 / 登录 / 退出（JWT Cookie + bcrypt）
- 笔记 CRUD + 标签 + 关键词搜索
- **Markdown** 编辑器（编辑 / 预览）
- 仪表盘统计
- **向量 RAG**（百炼 Embedding + pgvector 语义检索）
- AI 流式对话（通义千问 qwen-plus）
- 对话历史持久化 + 引用笔记来源展示
- Middleware 路由保护 + AI 接口限流

## 技术栈

- Next.js 16 · Drizzle ORM · Neon PostgreSQL · pgvector
- 阿里云百炼 DashScope（Chat + Embedding）
- Vercel AI SDK · Tailwind v4

## 快速开始

### 1. 环境配置

```powershell
cd zhinote
npm install
npm run setup          # 生成 SESSION_SECRET，创建/更新 .env.local
```

编辑 `.env.local`，填入：

```env
DATABASE_URL=postgresql://...   # Neon 连接串
DASHSCOPE_API_KEY=sk-...        # 百炼 API Key
SESSION_SECRET=...              # setup 脚本已自动生成
AI_MODEL=qwen-plus              # 可选
```

### 2. 数据库

```powershell
npm run db:push        # Drizzle 同步 schema
# 或（需先填 DATABASE_URL）
npm run db:migrate     # 执行 drizzle/0001_features.sql（pgvector 等）
```

在 Neon 控制台需启用 **pgvector** 扩展（迁移脚本会自动 `CREATE EXTENSION vector`）。

### 3. 启动

```powershell
npm run dev
```

访问 http://localhost:3000

## 部署 Vercel（阶段 4）

1. 将仓库推送到 GitHub
2. [vercel.com](https://vercel.com) → Import Project → 选择 `zhinote` 目录
3. 在 Vercel 环境变量中配置：
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `DASHSCOPE_API_KEY`
   - `AI_MODEL`（可选）
4. Deploy

或使用 CLI：

```powershell
npx vercel login
npx vercel --prod
```

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | AI 对话（流式），body 含 `sessionId` |
| GET/POST | `/api/chat/sessions` | 对话列表 / 新建 |
| GET/DELETE | `/api/chat/sessions/:id` | 对话详情 / 删除 |
| GET | `/api/chat/preview?q=` | 预览 RAG 检索结果 |

完整 API 见上方各模块路由。

## 安全说明

- 所有数据按 `user_id` 隔离
- AI 对话：每用户每分钟默认 20 次（`AI_RATE_LIMIT_PER_MIN`）
- **切勿**将 `DASHSCOPE_API_KEY` 提交到 Git 或暴露在前端
- API Key 若曾泄露，请在百炼控制台轮换

## 项目结构

```
zhinote/
├── app/(app)/        # 受保护页面（dashboard / notes / chat）
├── app/(auth)/       # 登录页
├── app/api/          # REST API
├── components/       # UI 组件
├── lib/ai/           # RAG、Embedding、Prompt
├── lib/chat/         # 对话持久化
├── middleware.ts     # 路由鉴权
└── drizzle/          # SQL 迁移
```

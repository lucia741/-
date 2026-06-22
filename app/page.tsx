export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 720 }}>
      <h1>智记 ZhiNote — API 服务</h1>
      <p>本项目为<strong>纯后端 API</strong>，前端请用 v0 或其他工具单独设计并对接以下接口。</p>
      <h2>快速检查</h2>
      <ul>
        <li>
          <a href="/api/health">GET /api/health</a> — 健康检查
        </li>
      </ul>
      <h2>认证</h2>
      <ul>
        <li>POST /api/auth/register</li>
        <li>POST /api/auth/login</li>
        <li>POST /api/auth/logout</li>
        <li>GET /api/auth/me</li>
      </ul>
      <h2>笔记</h2>
      <ul>
        <li>GET /api/notes?q=&amp;tag=</li>
        <li>POST /api/notes</li>
        <li>GET/PUT/DELETE /api/notes/:id</li>
        <li>GET /api/tags</li>
        <li>GET /api/dashboard</li>
      </ul>
      <h2>AI 对话</h2>
      <ul>
        <li>POST /api/chat（流式，AI SDK 协议）</li>
        <li>GET/POST /api/chat/sessions</li>
        <li>GET/DELETE /api/chat/sessions/:id</li>
        <li>GET /api/chat/preview?q=</li>
      </ul>
      <p>
        完整文档见仓库 <code>README.md</code>。所有受保护接口需登录 Cookie（先 register/login）。
      </p>
    </main>
  );
}

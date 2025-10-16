import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// 找到挂载节点
const root = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// ⚙️ 在开发环境仍使用 createRoot（支持 HMR 热更新）
// 🧱 在生产环境使用 hydrateRoot（复用 prerender 的 HTML）
if (import.meta.env.PROD) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

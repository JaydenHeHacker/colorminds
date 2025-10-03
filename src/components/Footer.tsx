import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent gradient-rainbow">
              Color Minds
            </h3>
            <p className="text-sm text-muted-foreground">
              释放创造力，探索无限可能。免费创意涂色页，随时下载打印！
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">分类</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#categories" className="hover:text-primary transition-smooth">动物</a></li>
              <li><a href="#categories" className="hover:text-primary transition-smooth">自然</a></li>
              <li><a href="#categories" className="hover:text-primary transition-smooth">节日</a></li>
              <li><a href="#categories" className="hover:text-primary transition-smooth">角色</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">资源</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#popular" className="hover:text-primary transition-smooth">热门作品</a></li>
              <li><a href="#popular" className="hover:text-primary transition-smooth">故事系列</a></li>
              <li><a href="/admin" className="hover:text-primary transition-smooth">创作中心</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">关于我们</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">其他</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">隐私政策</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">使用条款</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">联系我们</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            用 <Heart className="h-4 w-4 text-accent fill-accent" /> 为涂色爱好者打造
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2024 Color Minds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

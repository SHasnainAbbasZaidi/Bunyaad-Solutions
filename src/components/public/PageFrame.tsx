import { Header } from "./Header";
import { Footer } from "./Footer";
export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-28">
        {children}
      </main>
      <Footer />
    </div>
  );
}

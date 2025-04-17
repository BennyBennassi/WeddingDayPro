import { ReactNode } from "react";
import Header from "./header";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  onSave?: () => void;
  onShare?: () => void;
}

export default function Layout({ children, onSave, onShare }: LayoutProps) {
  const [location] = useLocation();
  const isHomePage = location === "/";
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onSave={isHomePage ? onSave : undefined}
        onShare={isHomePage ? onShare : undefined}
        showActionButtons={isHomePage}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
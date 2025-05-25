import Link from "next/link";
import { MessageSquareText } from "lucide-react"; // Changed icon
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
          <div className="p-1.5 rounded-md bg-primary/10">
            <MessageSquareText size={20} className="text-primary" /> {/* Changed icon */}
          </div>
          <span className="font-bold text-lg">CypherConfess</span> {/* Changed name */}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

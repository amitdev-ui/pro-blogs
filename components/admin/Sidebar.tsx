"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Play,
  FileSearch,
  Wand2,
  Clock,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Websites", href: "/admin/websites", icon: Globe },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Blog Analysis", href: "/admin/blog-analysis", icon: BarChart3 },
  { name: "Scraper", href: "/admin/scraper", icon: Play },
  { name: "Schedule", href: "/admin/schedule", icon: Clock },
  { name: "Fix Content", href: "/admin/fix-content", icon: Wand2 },
  { name: "Ads", href: "/admin/ads", icon: Megaphone },
  { name: "Logs", href: "/admin/logs", icon: FileSearch },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#E5E7EB] bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-18 items-center border-b border-[#E5E7EB] px-6">
          <Link href="/admin" className="flex items-center">
            <span className="text-lg font-semibold text-[#111827]">
              Admin Panel
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#F9FAFB] text-[#111827]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Site */}
        <div className="border-t border-[#E5E7EB] p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
          >
            <span>← Back to Site</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}


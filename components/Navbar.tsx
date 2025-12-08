"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, BookOpen, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Home", href: "/", icon: Sparkles, message: "Loading Home..." },
  { name: "Articles", href: "/articles", icon: BookOpen, message: "Loading Articles..." },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]"
            : "bg-white border-b border-[#E5E7EB]"
        )}
      >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="group flex items-center gap-2 text-xl md:text-2xl font-bold text-[#111827] transition-colors duration-200 hover:text-[#374151]"
            >
              <span>Blog Journal</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Search Button */}
            <Link
              href="/search"
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-md text-sm font-medium transition-colors duration-200",
                pathname === "/search"
                  ? "text-[#111827]"
                  : "text-[#6B7280] hover:text-[#111827]"
              )}
            >
              <Search className="h-5 w-5" />
            </Link>
            
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-[#111827]"
                      : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive && "text-[#111827]")} />
                  <span className="relative">{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111827] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/articles">
              <Button
                className="bg-[#111827] text-white hover:bg-[#374151] rounded-md px-6 py-2.5 font-medium transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Explore Articles
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 text-[#111827] hover:bg-[#F9FAFB] transition-colors duration-200 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[400px] bg-white border-l border-[#E5E7EB]"
              >
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Mobile Logo */}
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-bold text-[#111827] mb-4"
                  >
                    Blog Journal
                  </Link>

                  {/* Mobile Navigation Links */}
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200",
                          isActive
                            ? "text-[#111827]"
                            : "text-[#6B7280] hover:text-[#111827]"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                        {isActive && (
                          <span className="ml-auto h-1 w-1 bg-[#111827] rounded-full" />
                        )}
                      </Link>
                    );
                  })}

                  {/* Mobile CTA Button */}
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <Link href="/articles" onClick={() => setIsOpen(false)} className="block">
                      <Button
                        className="w-full bg-[#111827] text-white hover:bg-[#374151] rounded-md px-6 py-3 font-medium transition-colors duration-200"
                        size="default"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Explore Articles
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}

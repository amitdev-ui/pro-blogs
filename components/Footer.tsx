import Link from "next/link";
import { BookOpen, Sparkles, Github, Twitter, Linkedin, Mail } from "lucide-react";

const socialLinks = [
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "LinkedIn", href: "#", icon: Linkedin },
  { name: "GitHub", href: "#", icon: Github },
  { name: "Email", href: "#", icon: Mail },
];

const footerLinks = [
  { name: "Articles", href: "/articles" },
  { name: "About", href: "#" },
  { name: "Privacy", href: "#" },
  { name: "Terms", href: "#" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-b from-white to-[#F9FAFB] border-t border-[#E5E7EB]">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="py-12 md:py-16">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
            {/* Logo and Description */}
            <div className="flex flex-col gap-3 max-w-md">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-[#111827] hover:opacity-80 transition-opacity w-fit group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#111827] to-[#6B7280] opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-200" />
                  <span className="relative bg-gradient-to-r from-[#111827] to-[#6B7280] bg-clip-text text-transparent flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#111827]" />
                    Blog Journal
                  </span>
                </div>
              </Link>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Discover curated articles, stories, and inspiration from creators around the world.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Links</h3>
                <ul className="flex flex-col gap-2">
                  {footerLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Connect</h3>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <Link
                        key={social.name}
                        href={social.href}
                        className="group flex items-center justify-center w-9 h-9 rounded-lg bg-[#F9FAFB] text-[#6B7280] hover:bg-[#111827] hover:text-white transition-all duration-200"
                        aria-label={social.name}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[#6B7280]">
                © {new Date().getFullYear()} Blog Journal. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <span>Made with</span>
                <span className="text-red-500 animate-pulse">♥</span>
                <span>for readers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

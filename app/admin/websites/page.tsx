import { prisma } from "@/lib/prisma";
import WebsitesList from "@/components/admin/WebsitesList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

async function getWebsites() {
  return prisma.website.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          posts: true,
          logs: true,
        },
      },
    },
  });
}

export default async function WebsitesPage() {
  const websites = await getWebsites();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Websites</h1>
          <p className="text-[#6B7280] mt-1">
            Manage websites to scrape
          </p>
        </div>
        <Link href="/admin/websites/new">
          <Button className="bg-[#111827] text-white hover:bg-[#111827]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Website
          </Button>
        </Link>
      </div>

      {/* Websites List */}
      <WebsitesList initialWebsites={websites} />
    </div>
  );
}


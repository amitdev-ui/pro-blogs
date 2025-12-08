import { prisma } from "@/lib/prisma";
import LogsList from "@/components/admin/LogsList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

async function getLogs(searchParams: {
  website?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {};

  if (searchParams.website) {
    where.websiteId = searchParams.website;
  }

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.search) {
    where.message = {
      contains: searchParams.search,
    };
  }

  return prisma.log.findMany({
    where,
    include: { website: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function getWebsites() {
  return prisma.website.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    website?: string;
    status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const logs = await getLogs(params);
  const websites = await getWebsites();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Logs</h1>
        <p className="text-[#6B7280] mt-1">
          View scraping activity and errors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search logs..."
          defaultValue={params.search || ""}
          className="flex-1"
        />
        <Select defaultValue={params.website || "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Websites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                {website.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={params.status || "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <LogsList initialLogs={logs} />
    </div>
  );
}


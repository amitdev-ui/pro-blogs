import { prisma } from "@/lib/prisma";
import WebsiteForm from "@/components/admin/WebsiteForm";
import { notFound } from "next/navigation";

async function getWebsite(id: string) {
  return prisma.website.findUnique({
    where: { id },
  });
}

export default async function EditWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const website = await getWebsite(id);

  if (!website) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Edit Website</h1>
        <p className="text-[#6B7280] mt-1">Update website configuration</p>
      </div>

      <WebsiteForm website={website} />
    </div>
  );
}


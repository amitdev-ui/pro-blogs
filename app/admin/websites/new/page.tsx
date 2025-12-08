import WebsiteForm from "@/components/admin/WebsiteForm";

export default function NewWebsitePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Add New Website</h1>
        <p className="text-[#6B7280] mt-1">
          Configure a new website to scrape
        </p>
      </div>

      <WebsiteForm />
    </div>
  );
}


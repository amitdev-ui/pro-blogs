"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Website {
  id?: string;
  name: string;
  url: string;
  selectors: string;
}

interface WebsiteFormProps {
  website?: Website;
}

export default function WebsiteForm({ website }: WebsiteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: website?.name || "",
    url: website?.url || "",
    selectors: website?.selectors
      ? JSON.stringify(JSON.parse(website.selectors), null, 2)
      : JSON.stringify(
          {
            container: "article, .post-item",
            title: "h1, h2 a, .post-title",
            description: ".post-excerpt, .post-summary, p",
            author: ".author-name, .byline",
            authorImage: ".author-avatar img, .author-image img",
            date: "time, .post-date, [datetime]",
            image: "img:first, .post-image img",
            link: "a[href*='/blog/'], h2 a",
            category: ".post-category, .category",
            tags: ".post-tags a, .tags a",
          },
          null,
          2
        ),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate JSON
      const selectors = JSON.parse(formData.selectors);

      const url = website
        ? `/api/admin/websites/${website.id}`
        : "/api/admin/websites";
      const method = website ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          selectors: JSON.stringify(selectors),
        }),
      });

      if (response.ok) {
        router.push("/admin/websites");
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save website"}`);
      }
    } catch (error) {
      alert("Invalid JSON in selectors field");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="HubSpot Blog"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="https://blog.hubspot.com"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSS Selectors (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selectors">
              Selectors Configuration (JSON format)
            </Label>
            <Textarea
              id="selectors"
              value={formData.selectors}
              onChange={(e) =>
                setFormData({ ...formData, selectors: e.target.value })
              }
              className="font-mono text-sm"
              rows={15}
              required
            />
            <p className="text-xs text-[#6B7280]">
              Configure CSS selectors for extracting content from the website
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#111827] text-white hover:bg-[#111827]/90"
        >
          {isSubmitting ? "Saving..." : website ? "Update Website" : "Create Website"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}


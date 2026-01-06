"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  adCode: string | null;
  width: number | null;
  height: number | null;
  placement: string;
  isActive: boolean;
  createdAt: string;
}

const placements = [
  { value: "inline", label: "Blog Details Page (Inside Content) - Auto at 30%, 60%, 90%" },
  { value: "sidebar", label: "Sidebar - After Related Articles" },
  { value: "mobile", label: "Mobile - 100% × 250-280px (Top, Sidebar, Bottom)" },
  { value: "footer", label: "Footer" },
];

export default function AdsAdminPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    adCode: "",
    placement: "inline",
  });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      setAds(data.ads || []);
    } catch (e) {
      console.error("Error loading ads", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.adCode) {
      alert("Please fill title and ad code");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          adCode: form.adCode,
          placement: form.placement,
          linkUrl: "#", // Required field but not used
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("API Error:", data);
        throw new Error(data.error || `Failed to create ad (Status: ${res.status})`);
      }
      setForm({ 
        title: "", 
        adCode: "",
        placement: form.placement 
      });
      fetchAds();
      alert("Ad created successfully!");
    } catch (e: any) {
      console.error("Error creating ad:", e);
      alert(`Error: ${e.message || "Failed to create ad. Please check the console for details."}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id, isActive: !ad.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ad");
      fetchAds();
    } catch (e: any) {
      alert(e.message || "Failed to update ad");
    }
  };

  const deleteAd = async (ad: Ad) => {
    if (!confirm("Delete this ad?")) return;
    try {
      const res = await fetch("/api/admin/ads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete ad");
      fetchAds();
    } catch (e: any) {
      alert(e.message || "Failed to delete ad");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Ad Slot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Short label for this ad"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">Placement *</label>
              <select
                className="border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                value={form.placement}
                onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
              >
                {placements.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827]">
              Ad Code (HTML/JavaScript) *
            </label>
            <Textarea
              value={form.adCode}
              onChange={(e) => setForm((f) => ({ ...f, adCode: e.target.value }))}
              placeholder="Paste your ad code here. The slot will automatically adjust to the ad dimensions."
              className="font-mono text-sm min-h-[200px]"
              rows={10}
              required
            />
            <p className="text-xs text-[#6B7280]">
              The ad slot will automatically detect and adjust to your ad&apos;s width and height. 
              For column ads (e.g., 120px wide), the slot will automatically become responsive.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-[#111827] text-white hover:bg-[#111827]/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Ad
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Ads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[#6B7280] text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading ads...
            </div>
          ) : ads.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No ads created yet.</p>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#111827]">{ad.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                        {ad.placement}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] truncate max-w-xs md:max-w-md">
                      {ad.adCode ? "Ad Code Configured" : "No Ad Code"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#6B7280]">Active</span>
                      <input
                        type="checkbox"
                        checked={ad.isActive}
                        onChange={() => toggleActive(ad)}
                        className="h-4 w-4 accent-[#111827]"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteAd(ad)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Play, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Website {
  id: string;
  name: string;
  url: string;
  selectors: any;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    posts: number;
    logs: number;
  };
}

interface WebsitesListProps {
  initialWebsites: Website[];
}

export default function WebsitesList({ initialWebsites }: WebsitesListProps) {
  const [websites, setWebsites] = useState(initialWebsites);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setWebsiteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!websiteToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/websites/${websiteToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWebsites(websites.filter((w) => w.id !== websiteToDelete));
        setDeleteDialogOpen(false);
        setWebsiteToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting website:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestScrape = async (id: string) => {
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: id }),
      });

      if (response.ok) {
        alert("Scraping started! Check logs for progress.");
      }
    } catch (error) {
      console.error("Error starting scrape:", error);
      alert("Failed to start scraping");
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {websites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#6B7280] py-8">
                  No websites added yet
                </TableCell>
              </TableRow>
            ) : (
              websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#6B7280]" />
                      <span className="font-medium text-[#111827]">
                        {website.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#6B7280] hover:text-[#111827] hover:underline"
                    >
                      {website.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">
                      {website._count.posts}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">
                      {formatDate(website.createdAt.toString())}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestScrape(website.id)}
                        className="h-8 w-8 p-0"
                        title="Test Scrape"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/websites/${website.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(website.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Website</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this website? This action cannot
              be undone and will also delete all associated posts and logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setWebsiteToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


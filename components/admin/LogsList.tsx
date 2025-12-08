"use client";

import { formatDate } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe } from "lucide-react";

interface Log {
  id: string;
  message: string;
  status: string;
  createdAt: Date;
  website: {
    id: string;
    name: string;
  };
}

interface LogsListProps {
  initialLogs: Log[];
}

export default function LogsList({ initialLogs }: LogsListProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-[#6B7280] py-8">
                No logs found
              </TableCell>
            </TableRow>
          ) : (
            initialLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        log.status === "success" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {log.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#6B7280]" />
                    <span className="text-sm text-[#111827]">
                      {log.website.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-[#6B7280] line-clamp-2">
                    {log.message}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-[#6B7280]">
                    {formatDate(log.createdAt.toString())}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

interface FieldDef {
  label: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  row: Record<string, any> | null;
  fields: FieldDef[];
  extraContent?: React.ReactNode;
}

export function DetailModal({
  open,
  onClose,
  title,
  row,
  fields,
  extraContent,
}: DetailModalProps) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {f.label}
              </span>
              <div className="font-medium break-words">
                {f.render ? (
                  f.render(row[f.key], row)
                ) : row[f.key] != null ? (
                  String(row[f.key])
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {extraContent && <div className="mt-4">{extraContent}</div>}
        <div className="mt-4 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

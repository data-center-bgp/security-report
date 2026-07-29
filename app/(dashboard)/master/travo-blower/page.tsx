"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { SITES } from "@/lib/sites";

type Jenis = "travo" | "blower";

type MasterTravoBlower = {
  id: string;
  business_unit: string;
  jenis: Jenis;
  pemilik: string;
  nomor_unit: string;
  aktif: boolean;
  created_at?: string;
  updated_at?: string;
};

const PAGE_SIZE = 20;

/** business_unit yang boleh mengakses master data ini */
const ALLOWED_UNITS = ["master", "tst", "shipyard", "shorebase"];

type FormState = {
  business_unit: string;
  jenis: Jenis;
  pemilik: string;
  nomor_unit: string;
  aktif: boolean;
};

const EMPTY_FORM: FormState = {
  business_unit: "",
  jenis: "travo",
  pemilik: "",
  nomor_unit: "",
  aktif: true,
};

export default function MasterTravoBlowerPage() {
  const { profile, isMaster, loading: authLoading } = useAuth();
  const supabase = createBrowserClient();

  const myUnit = (profile?.business_unit ?? "").toLowerCase();
  const canAccess = ALLOWED_UNITS.includes(myUnit);

  const [rows, setRows] = useState<MasterTravoBlower[]>([]);
  const [loading, setLoading] = useState(true);

  // table controls (client-side)
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("pemilik");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MasterTravoBlower | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MasterTravoBlower | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("master_travo_blower")
      .select("*")
      .order("pemilik", { ascending: true })
      .order("jenis", { ascending: true })
      .order("nomor_unit", { ascending: true });

    if (error) {
      console.error("[master_travo_blower] gagal memuat:", error);
      toast.error(`Gagal memuat data: ${error.message}`);
      setRows([]);
    } else {
      setRows((data as MasterTravoBlower[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading || !canAccess) return;
    fetchData();
  }, [authLoading, canAccess, fetchData]);

  function setSearch(v: string) {
    setSearchRaw(v);
    setPage(1);
  }

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // client-side search + sort + pagination
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((r) =>
        [
          r.business_unit,
          r.jenis,
          r.pemilik,
          r.nomor_unit,
          r.aktif ? "aktif" : "tidak aktif",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey as keyof MasterTravoBlower];
      const bv = b[sortKey as keyof MasterTravoBlower];
      let cmp: number;
      if (typeof av === "boolean" || typeof bv === "boolean") {
        cmp = Number(av) - Number(bv);
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), "id", {
          numeric: true,
        });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  function openAdd() {
    setEditing(null);
    // user site terkunci ke unitnya; master memilih sendiri
    setForm({ ...EMPTY_FORM, business_unit: isMaster ? "" : myUnit });
    setDialogOpen(true);
  }

  function openEdit(row: MasterTravoBlower) {
    setEditing(row);
    setForm({
      business_unit: row.business_unit,
      jenis: row.jenis,
      pemilik: row.pemilik,
      nomor_unit: row.nomor_unit,
      aktif: row.aktif,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const pemilik = form.pemilik.trim();
    const nomor_unit = form.nomor_unit.trim();
    // user site selalu terkunci ke unitnya; master pakai pilihan di form
    const business_unit = isMaster ? form.business_unit : myUnit;

    if (!business_unit) {
      toast.error("Site wajib dipilih");
      return;
    }
    if (!pemilik) {
      toast.error("Pemilik wajib diisi");
      return;
    }
    if (!nomor_unit) {
      toast.error("Nomor unit wajib diisi");
      return;
    }

    setSaving(true);
    const payload = {
      business_unit,
      jenis: form.jenis,
      pemilik,
      nomor_unit,
      aktif: form.aktif,
    };

    const { error } = editing
      ? await supabase
          .from("master_travo_blower")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("master_travo_blower").insert(payload);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error(
          `Kombinasi pemilik "${pemilik}", jenis ${form.jenis}, dan nomor unit "${nomor_unit}" sudah ada.`,
        );
      } else {
        toast.error(`Gagal menyimpan: ${error.message}`);
      }
      return;
    }

    toast.success(editing ? "Data diperbarui" : "Data ditambahkan");
    setDialogOpen(false);
    fetchData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("master_travo_blower")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      toast.error(`Gagal menghapus: ${error.message}`);
      return;
    }
    toast.success("Data dihapus");
    setDeleteTarget(null);
    fetchData();
  }

  const columns: ColumnDef<MasterTravoBlower>[] = [
    ...(isMaster
      ? [
          {
            key: "business_unit",
            label: "Site",
            sortable: true,
            render: (r: MasterTravoBlower) => (
              <BusinessUnitBadge value={r.business_unit} />
            ),
          },
        ]
      : []),
    {
      key: "jenis",
      label: "Jenis",
      sortable: true,
      render: (r) => (
        <Badge variant={r.jenis === "travo" ? "default" : "secondary"}>
          {r.jenis === "travo" ? "Travo" : "Blower"}
        </Badge>
      ),
    },
    { key: "pemilik", label: "Pemilik", sortable: true },
    { key: "nomor_unit", label: "Nomor Unit", sortable: true },
    {
      key: "aktif",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.aktif ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary">Tidak Aktif</Badge>
        ),
    },
    {
      key: "_aksi",
      label: "Aksi",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit"
            onClick={() => openEdit(r)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Hapus"
            onClick={() => setDeleteTarget(r)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // --- Access guard ---
  if (!authLoading && !canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Akses Ditolak</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-md">
          Halaman master data Travo/Blower hanya dapat diakses oleh pengguna
          Master, TST, Shipyard, dan Shorebase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Master Data Travo / Blower</h1>
          <p className="text-muted-foreground text-sm">
            Kelola daftar travo dan blower beserta pemilik dan nomor unitnya
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Tambah Data
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        totalCount={filtered.length}
        loading={loading || authLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        search={search}
        onSearchChange={setSearch}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        exportFilename="master-travo-blower"
      />

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Travo / Blower" : "Tambah Travo / Blower"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="business_unit">Site</Label>
              {isMaster ? (
                <NativeSelect
                  id="business_unit"
                  value={form.business_unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_unit: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    — Pilih site —
                  </option>
                  {SITES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3">
                  <BusinessUnitBadge value={myUnit} />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jenis">Jenis</Label>
              <NativeSelect
                id="jenis"
                value={form.jenis}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jenis: e.target.value as Jenis }))
                }
              >
                <option value="travo">Travo</option>
                <option value="blower">Blower</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pemilik">Pemilik</Label>
              <Input
                id="pemilik"
                value={form.pemilik}
                placeholder="Nama pemilik"
                onChange={(e) =>
                  setForm((f) => ({ ...f, pemilik: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nomor_unit">Nomor Unit</Label>
              <Input
                id="nomor_unit"
                value={form.nomor_unit}
                placeholder="mis. 1, 2, U-01"
                onChange={(e) =>
                  setForm((f) => ({ ...f, nomor_unit: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Satu pemilik bisa punya lebih dari satu unit — beri nomor untuk
                membedakannya.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aktif">Status</Label>
              <NativeSelect
                id="aktif"
                value={form.aktif ? "aktif" : "tidak"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aktif: e.target.value === "aktif" }))
                }
              >
                <option value="aktif">Aktif</option>
                <option value="tidak">Tidak Aktif</option>
              </NativeSelect>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Data</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.jenis === "travo" ? "Travo" : "Blower"} —{" "}
              {deleteTarget?.pemilik} (No. {deleteTarget?.nomor_unit})
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

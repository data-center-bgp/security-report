"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase";
import { applyBusinessUnitFilter } from "@/lib/dataFilters";
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
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";

// Sumber data = tabel `pic_security` yang sudah ada (dipakai juga sebagai
// pilihan petugas di aplikasi mobile).
type PicSecurity = {
  id: number;
  business_unit: string;
  nama: string;
  lokasi: string | null;
  created_at?: string;
};

const PAGE_SIZE = 20;

/** business_unit login yang boleh membuka halaman ini */
const ALLOWED_UNITS = ["master", "tst", "shipyard", "shorebase"];

/** Unit yang tersedia di data pic_security (master memilih saat menambah) */
const UNIT_OPTIONS = [
  { value: "shipyard", label: "Shipyard" },
  { value: "shorebase", label: "Shorebase" },
  { value: "tst", label: "TST" },
  { value: "gas", label: "Gas" },
];

type FormState = {
  business_unit: string;
  nama: string;
  lokasi: string;
};

const EMPTY_FORM: FormState = {
  business_unit: "",
  nama: "",
  lokasi: "",
};

export default function MasterSecurityPage() {
  const { profile, isMaster, loading: authLoading } = useAuth();
  const supabase = createBrowserClient();

  const myUnit = (profile?.business_unit ?? "").toLowerCase();
  const canAccess = ALLOWED_UNITS.includes(myUnit);

  const [rows, setRows] = useState<PicSecurity[]>([]);
  const [loading, setLoading] = useState(true);

  // table controls (client-side)
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("nama");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PicSecurity | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PicSecurity | null>(null);
  const [deleting, setDeleting] = useState(false);

  // pic_security RLS permisif -> scoping site dilakukan di query, bukan RLS.
  const filterUnit = isMaster ? null : myUnit;

  const fetchData = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("pic_security")
      .select("id, business_unit, nama, lokasi, created_at")
      .order("business_unit", { ascending: true })
      .order("nama", { ascending: true });
    q = applyBusinessUnitFilter(q as any, filterUnit);

    const { data, error } = await q;

    if (error) {
      console.error("[pic_security] gagal memuat:", error);
      toast.error(`Gagal memuat data: ${error.message}`);
      setRows([]);
    } else {
      setRows((data as PicSecurity[]) ?? []);
    }
    setLoading(false);
  }, [filterUnit]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((r) =>
        [r.business_unit, r.nama, r.lokasi ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey as keyof PicSecurity];
      const bv = b[sortKey as keyof PicSecurity];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), "id", {
        numeric: true,
      });
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
    setForm({ ...EMPTY_FORM, business_unit: isMaster ? "" : myUnit });
    setDialogOpen(true);
  }

  function openEdit(row: PicSecurity) {
    setEditing(row);
    setForm({
      business_unit: row.business_unit,
      nama: row.nama,
      lokasi: row.lokasi ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const nama = form.nama.trim();
    const business_unit = isMaster ? form.business_unit : myUnit;

    if (!business_unit) {
      toast.error("Site wajib dipilih");
      return;
    }
    if (!nama) {
      toast.error("Nama wajib diisi");
      return;
    }

    setSaving(true);
    const payload = {
      business_unit,
      nama,
      lokasi: form.lokasi.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("pic_security").update(payload).eq("id", editing.id)
      : await supabase.from("pic_security").insert(payload);

    setSaving(false);

    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`);
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
      .from("pic_security")
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

  const columns: ColumnDef<PicSecurity>[] = [
    ...(isMaster
      ? [
          {
            key: "business_unit",
            label: "Site",
            sortable: true,
            render: (r: PicSecurity) => (
              <BusinessUnitBadge value={r.business_unit} />
            ),
          },
        ]
      : []),
    { key: "nama", label: "Nama", sortable: true },
    {
      key: "lokasi",
      label: "Lokasi",
      sortable: true,
      render: (r) => r.lokasi || "-",
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
          Halaman master data Nama Security hanya dapat diakses oleh pengguna
          Master, TST, Shipyard, dan Shorebase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Master Data Nama Security</h1>
          <p className="text-muted-foreground text-sm">
            Kelola daftar nama security — dipakai sebagai pilihan petugas di
            aplikasi mobile
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
        exportFilename="nama-security"
      />

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Security" : "Tambah Security"}
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
                  {UNIT_OPTIONS.map((s) => (
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
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={form.nama}
                placeholder="Nama security"
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lokasi">
                Lokasi{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </Label>
              <Input
                id="lokasi"
                value={form.lokasi}
                placeholder="mis. SAMARINDA, KUKAR"
                onChange={(e) =>
                  setForm((f) => ({ ...f, lokasi: e.target.value }))
                }
              />
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
            Yakin ingin menghapus security{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.nama}
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

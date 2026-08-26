"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Farmer } from "@/lib/types";

const FACTORY_NAME =
  process.env.NEXT_PUBLIC_FACTORY_NAME || "Chebango EPZ Tea Factory";
const CLERK_PASSWORD = "Tea@Factory2030!";
const ADMIN_PASSWORD = "AdminTea@2026";

// ── Placeholder content (replace later with real data) ──────────────
const FACTORY_INFO = {
  about:
    "Chebango Tea Company Ltd operates Chebango EPZ Tea Factory, processing high-quality orthodox and CTC teas. We support local farmers and produce Black, Green, Purple and Yellow teas for local and export markets.",
  address: "P.O Box 53, Sotik",
  phone: "+254 740 643 077",
  email: "customercare@chebangoteafactory.co.ke",
  website: "www.chebangoteafactory.co.ke",
  youtubeId: "2TnEApznHAk",
};

type MainTab = "home" | "search" | "id_capture" | "admin";
type AdminSubTab = "upload" | "add" | "delete" | "list";

export default function Dashboard() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // Tabs
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>("upload");
  const [tabLoading, setTabLoading] = useState(false);

  // Search
  const [searchType, setSearchType] = useState<"national_id" | "grower_number">(
    "national_id"
  );
  const [searchValue, setSearchValue] = useState("");
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);

  // Admin – list
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Admin – add
  const [newFarmer, setNewFarmer] = useState({
    grower_number: "",
    name: "",
    national_id: "",
    mobile_number: "",
    buying_center: "",
    route: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Admin – CSV
  const [csvPreview, setCsvPreview] = useState<Farmer[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // ID Capture
  const [idForm, setIdForm] = useState({
    full_name: "",
    national_id: "",
    mobile_number: "",
    grower_number: "",
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
  });
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idBankFile, setIdBankFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>("");
  const [idBackPreview, setIdBackPreview] = useState<string>("");
  const [idBankPreview, setIdBankPreview] = useState<string>("");
  const [idNameConfirmed, setIdNameConfirmed] = useState(false);
  // Live camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<"front" | "back" | "bank" | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image crop modal
  const [cropOpen, setCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"front" | "back" | "bank" | null>(null);
  const [cropSource, setCropSource] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);

  const [idLoading, setIdLoading] = useState(false);
  const [idMessage, setIdMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [idSavedRecord, setIdSavedRecord] = useState<{
    id: string;
    full_name: string;
    national_id: string;
    mobile_number: string;
    grower_number: string;
    bank_account_number: string;
    bank_name: string;
    bank_branch: string;
    front_preview: string;
    back_preview: string;
    bank_preview: string;
    created_at: string;
  } | null>(null);

  type IdCaptureListItem = {
    id: string;
    full_name: string;
    national_id: string;
    mobile_number: string | null;
    grower_number: string | null;
    created_at: string;
  };

  const [idCaptureList, setIdCaptureList] = useState<IdCaptureListItem[]>([]);
  const [idListLoading, setIdListLoading] = useState(false);
  const [idListSearch, setIdListSearch] = useState("");
  const [idListError, setIdListError] = useState("");
  const [idViewMode, setIdViewMode] = useState<"form" | "list" | "detail">("list");

  // ── Session (auto-login) ────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("chebango_clerk_session");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
    setCheckingSession(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CLERK_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("chebango_clerk_session", "true");
      setAuthError("");
      setPassword("");
    } else {
      setAuthError("Wrong password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminUnlocked(false);
    localStorage.removeItem("chebango_clerk_session");
    setMainTab("home");
    setFarmer(null);
    setSearchValue("");
    setAuthError("");
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminUnlocked(true);
      setAdminPassword("");
      setAuthError("");
    } else {
      setAuthError("Wrong admin password.");
    }
  };

  // ── Tab switch with short loader ────────────────────────────────
  const switchTab = (tab: MainTab) => {
    if (tab === mainTab) return;
    setTabLoading(true);
    setTimeout(() => {
      setMainTab(tab);
      setTabLoading(false);
      setAdminMessage(null);
      setSearchError("");
    }, 350);
  };

  // ── Search ──────────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setFarmer(null);
    setSearched(false);

    try {
      const column =
        searchType === "national_id" ? "national_id" : "grower_number";

      const { data, error } = await supabase
        .from("Farmers")
        .select("grower_number, name, national_id, mobile_number, buying_center, route")
        .eq(column, searchValue.trim())
        .maybeSingle();

      if (error) {
        console.error(error);
        setSearchError("Search failed. Please try again.");
      } else if (!data) {
        setSearchError(
          searchType === "national_id"
            ? "No farmer found with this National ID."
            : "No farmer found with this Grower Number."
        );
        setSearched(true);
      } else {
        setFarmer(data);
        setSearched(true);
      }
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Admin list ──────────────────────────────────────────────────
  const fetchFarmers = useCallback(async () => {
    setListLoading(true);
    try {
      let query = supabase
        .from("Farmers")
        .select("grower_number, name, national_id, mobile_number, buying_center, route", {
          count: "exact",
        })
        .order("name", { ascending: true })
        .limit(200);

      if (listSearch.trim()) {
        const term = listSearch.trim();
        query = query.or(
          `name.ilike.%${term}%,national_id.ilike.%${term}%,grower_number.ilike.%${term}%`
        );
      }

      const { data, error, count } = await query;
      if (error) {
        console.error(error);
        setAdminMessage({
          type: "error",
          text: `Failed to load farmers. ${error.message || ""}`,
        });
      } else {
        setFarmers(data || []);
        setTotalCount(count || 0);
      }
    } catch {
      setAdminMessage({ type: "error", text: "Failed to load farmers." });
    } finally {
      setListLoading(false);
    }
  }, [listSearch]);

  useEffect(() => {
    if (
      isAuthenticated &&
      isAdminUnlocked &&
      (adminSubTab === "list" || adminSubTab === "delete")
    ) {
      fetchFarmers();
      setSelectedIds([]);
    }
  }, [isAuthenticated, isAdminUnlocked, adminSubTab, fetchFarmers]);

  useEffect(() => {
    if (isAuthenticated && mainTab === "id_capture") {
      fetchIdCaptures();
    }
  }, [isAuthenticated, mainTab]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectFarmer = (nationalId: string) => {
    setSelectedIds((prev) =>
      prev.includes(nationalId)
        ? prev.filter((id) => id !== nationalId)
        : [...prev, nationalId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === farmers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(farmers.map((f) => f.national_id).filter(Boolean));
    }
  };

  const handleDeleteFarmer = async (nationalId: string, name: string) => {
    const ok = window.confirm(
      `Delete farmer "${name}" (ID: ${nationalId})?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setDeletingId(nationalId);
    setAdminMessage(null);
    try {
      const { error } = await supabase
        .from("Farmers")
        .delete()
        .eq("national_id", nationalId);

      if (error) {
        setAdminMessage({
          type: "error",
          text: error.message || "Failed to delete farmer.",
        });
      } else {
        setFarmers((prev) => prev.filter((f) => f.national_id !== nationalId));
        setSelectedIds((prev) => prev.filter((id) => id !== nationalId));
        setTotalCount((c) => Math.max(0, c - 1));
        setAdminMessage({
          type: "success",
          text: `Deleted "${name}" successfully.`,
        });
      }
    } catch {
      setAdminMessage({ type: "error", text: "Delete failed. Try again." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      setAdminMessage({
        type: "error",
        text: "Select at least one farmer to delete.",
      });
      return;
    }
    const ok = window.confirm(
      `Delete ${selectedIds.length} selected farmer(s)?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setBulkDeleting(true);
    setAdminMessage(null);
    try {
      const { error } = await supabase
        .from("Farmers")
        .delete()
        .in("national_id", selectedIds);

      if (error) {
        setAdminMessage({
          type: "error",
          text: error.message || "Bulk delete failed.",
        });
      } else {
        const removed = selectedIds.length;
        setFarmers((prev) =>
          prev.filter((f) => !selectedIds.includes(f.national_id))
        );
        setTotalCount((c) => Math.max(0, c - removed));
        setSelectedIds([]);
        setAdminMessage({
          type: "success",
          text: `Deleted ${removed} farmer(s) successfully.`,
        });
      }
    } catch {
      setAdminMessage({ type: "error", text: "Bulk delete failed." });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAllLoaded = async () => {
    if (farmers.length === 0) return;
    const ok = window.confirm(
      `Delete ALL ${farmers.length} farmer(s) currently shown in this list?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    const ids = farmers.map((f) => f.national_id).filter(Boolean);
    setSelectedIds(ids);
    setBulkDeleting(true);
    setAdminMessage(null);
    try {
      const { error } = await supabase
        .from("Farmers")
        .delete()
        .in("national_id", ids);
      if (error) {
        setAdminMessage({
          type: "error",
          text: error.message || "Delete all failed.",
        });
      } else {
        setFarmers([]);
        setSelectedIds([]);
        setTotalCount((c) => Math.max(0, c - ids.length));
        setAdminMessage({
          type: "success",
          text: `Deleted ${ids.length} farmer(s).`,
        });
      }
    } catch {
      setAdminMessage({ type: "error", text: "Delete all failed." });
    } finally {
      setBulkDeleting(false);
    }
  };

  /** Delete every farmer row in the database (not only the page list). */
  const handleDeleteEntireDatabase = async () => {
    const ok1 = window.confirm(
      "WARNING: This will permanently delete ALL farmers that have been uploaded in the system.\n\nContinue?"
    );
    if (!ok1) return;
    const ok2 = window.confirm(
      "Final confirmation: Delete EVERY farmer record in the database?\n\nThis cannot be undone."
    );
    if (!ok2) return;

    setBulkDeleting(true);
    setAdminMessage(null);
    try {
      // PostgREST requires a filter; this matches all non-null national_id rows
      const { error, count } = await supabase
        .from("Farmers")
        .delete({ count: "exact" })
        .neq("national_id", "");

      if (error) {
        setAdminMessage({
          type: "error",
          text: error.message || "Failed to delete all farmers.",
        });
      } else {
        setFarmers([]);
        setSelectedIds([]);
        setTotalCount(0);
        setAdminMessage({
          type: "success",
          text: `All farmers deleted successfully${
            count != null ? ` (${count} records)` : ""
          }.`,
        });
      }
    } catch {
      setAdminMessage({
        type: "error",
        text: "Failed to delete all farmers from the database.",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── Add farmer ──────────────────────────────────────────────────
  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAdminMessage(null);

    const payload = {
      grower_number: newFarmer.grower_number.trim(),
      name: newFarmer.name.trim(),
      national_id: newFarmer.national_id.trim(),
      mobile_number: newFarmer.mobile_number.trim() || null,
      buying_center: newFarmer.buying_center.trim() || null,
      route: newFarmer.route.trim() || null,
    };

    if (!payload.grower_number || !payload.name || !payload.national_id) {
      setAdminMessage({
        type: "error",
        text: "Grower Number, Name and National ID are required.",
      });
      setAddLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("Farmers")
        .upsert(payload, { onConflict: "national_id" });

      if (error) {
        setAdminMessage({
          type: "error",
          text: error.message || "Failed to save farmer.",
        });
      } else {
        setAdminMessage({
          type: "success",
          text: `Farmer "${payload.name}" saved successfully.`,
        });
        setNewFarmer({
          grower_number: "",
          name: "",
          national_id: "",
          mobile_number: "",
          buying_center: "",
          route: "",
        });
      }
    } catch {
      setAdminMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setAddLoading(false);
    }
  };

  // ── CSV helpers ─────────────────────────────────────────────────
  function parseCsv(text: string): Farmer[] {
    // Strip BOM if present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    // Detect delimiter (comma, semicolon, or tab)
    const headerLine = lines[0];
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;
    let delimiter = ",";
    if (semiCount > commaCount && semiCount >= tabCount) delimiter = ";";
    else if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";

    const splitLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else current += char;
      }
      result.push(current.trim());
      return result;
    };

    // Strip BOM and normalise headers
    const rawHeaders = splitLine(lines[0]).map((h) =>
      h
        .replace(/^\uFEFF/, "")
        .toLowerCase()
        .replace(/"/g, "")
        .replace(/\./g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .trim()
    );

    // Supports:
    // Grower No. | Farmer Name | Buying Center | ID No. | mobile number | Route | date
    // GROWER NO. | First/Middle/Last Name | ID Number | Farmer Mobile Number | ...
    const mapHeader = (h: string): string => {
      // Grower / Farmers number
      if (
        h.includes("grower") ||
        h.includes("farmers_no") ||
        h.includes("farmer_no") ||
        h === "g_no" ||
        h === "growerno" ||
        h === "grower_no" ||
        h === "farmerno" ||
        h === "farmer_number" ||
        h === "farmers_number"
      )
        return "grower_number";

      // National ID / ID No. / ID Number
      if (
        h === "id_number" ||
        h === "national_id" ||
        h === "nationalid" ||
        h === "nid" ||
        h === "id_no" ||
        h === "idno" ||
        h === "id" ||
        h === "national_id_number" ||
        (h.includes("id") && (h.includes("number") || h.includes("no")))
      )
        return "national_id";

      // Mobile
      if (
        h.includes("mobile") ||
        h.includes("phone") ||
        h === "tel" ||
        h === "telephone"
      )
        return "mobile_number";

      // Name parts OR full name in one column (Farmer Name)
      if (h === "first_name" || h === "firstname" || h === "fname")
        return "first_name";
      if (h === "middle_name" || h === "middlename" || h === "mname")
        return "middle_name";
      if (
        h === "last_name" ||
        h === "lastname" ||
        h === "lname" ||
        h === "surname"
      )
        return "last_name";
      if (
        h === "name" ||
        h === "farmer_name" ||
        h === "full_name" ||
        h === "farmers_name" ||
        (h.includes("farmer") && h.includes("name")) ||
        (h.includes("name") && !h.includes("file") && !h.includes("user"))
      )
        return "name";

      // Buying center
      if (
        h.includes("buying") ||
        h.includes("centre") ||
        h.includes("center") ||
        h.includes("location") ||
        h === "bc"
      )
        return "buying_center";

      // Route (not "route" false positives)
      if (h.includes("route") || h === "raute") return "route";

      // Optional date — not stored in Farmers search table
      if (h.includes("date") || h.includes("registered")) return "_ignore";

      if (
        h.includes("bank") ||
        h.includes("account") ||
        h.includes("gender") ||
        h.includes("acreage") ||
        h.includes("supplied") ||
        h.includes("kg")
      )
        return "_ignore";

      return h;
    };

    const mappedHeaders = rawHeaders.map(mapHeader);
    const rows: Farmer[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i]);
      const row: Record<string, string> = {};
      mappedHeaders.forEach((h, idx) => {
        if (h === "_ignore") return;
        row[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
      });

      // Build full name from parts if needed
      let fullName = (row.name || "").trim();
      if (!fullName) {
        fullName = [row.first_name, row.middle_name, row.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      const grower = String(row.grower_number || "").trim();
      const nationalId = String(row.national_id || "").trim();

      // Required: grower number, name, national ID
      if (grower && fullName && nationalId) {
        rows.push({
          grower_number: grower,
          name: fullName,
          national_id: nationalId,
          mobile_number: String(row.mobile_number || "").trim(),
          buying_center: String(row.buying_center || "").trim(),
          route: String(row.route || "").trim(),
        });
      }
    }
    return rows;
  }


  // ── ID Capture helpers ──────────────────────────────────────────
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const openCrop = (target: "front" | "back" | "bank", source: string) => {
    if (!source) return;
    setCropTarget(target);
    setCropSource(source);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setCropOpen(true);
  };

  const applyCrop = () => {
    if (!cropSource || !cropTarget) return;
    const img = new Image();
    img.onload = () => {
      // Output square-ish document crop from center with zoom/pan
      const outW = 1200;
      const outH = 750;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = Math.max(outW / img.width, outH / img.height) * cropZoom;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (outW - drawW) / 2 + cropOffsetX;
      const dy = (outH - drawH) / 2 + cropOffsetY;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(img, dx, dy, drawW, drawH);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      if (cropTarget === "front") setIdFrontPreview(dataUrl);
      if (cropTarget === "back") setIdBackPreview(dataUrl);
      if (cropTarget === "bank") setIdBankPreview(dataUrl);
      setCropOpen(false);
      setCropTarget(null);
      setCropSource("");
    };
    img.src = cropSource;
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openCamera = async (target: "front" | "back" | "bank") => {
    setCameraError("");
    setCameraTarget(target);
    setCameraOpen(true);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      // slight delay so video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setCameraError(
        "Could not access camera. Allow camera permission in the browser, or use From gallery instead."
      );
    }
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraTarget(null);
    setCameraError("");
  };

  const snapCameraPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (cameraTarget === "front") {
      setIdFrontPreview(dataUrl);
      setIdFrontFile(null);
      closeCamera();
      openCrop("front", dataUrl);
      return;
    } else if (cameraTarget === "back") {
      setIdBackPreview(dataUrl);
      setIdBackFile(null);
      closeCamera();
      openCrop("back", dataUrl);
      return;
    } else if (cameraTarget === "bank") {
      setIdBankPreview(dataUrl);
      setIdBankFile(null);
      closeCamera();
      openCrop("bank", dataUrl);
      return;
    }
    closeCamera();
  };

  const handleIdFrontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setIdMessage({ type: "error", text: "Front ID must be an image file." });
      return;
    }
    setIdFrontFile(file);
    const url = await fileToDataUrl(file);
    setIdFrontPreview(url);
    openCrop("front", url);
  };

  const handleIdBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setIdMessage({ type: "error", text: "Back ID must be an image file." });
      return;
    }
    setIdBackFile(file);
    const url = await fileToDataUrl(file);
    setIdBackPreview(url);
    openCrop("back", url);
  };

  const handleIdBankChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setIdMessage({
        type: "error",
        text: "Bank details photo must be an image file.",
      });
      return;
    }
    setIdBankFile(file);
    const url = await fileToDataUrl(file);
    setIdBankPreview(url);
    openCrop("bank", url);
  };

  const resetIdForm = () => {
    closeCamera();
    setIdForm({
      full_name: "",
      national_id: "",
      mobile_number: "",
      grower_number: "",
      bank_account_number: "",
      bank_name: "",
      bank_branch: "",
    });
    setIdFrontFile(null);
    setIdBackFile(null);
    setIdBankFile(null);
    setIdFrontPreview("");
    setIdBackPreview("");
    setIdBankPreview("");
    setIdNameConfirmed(false);
    setIdSavedRecord(null);
    setIdMessage(null);
    setIdViewMode("form");
  };

  const fetchIdCaptures = async () => {
    setIdListLoading(true);
    setIdListError("");
    try {
      let query = supabase
        .from("id_captures")
        .select("id, full_name, national_id, mobile_number, grower_number, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (idListSearch.trim()) {
        const t = idListSearch.trim();
        query = query.or(
          `full_name.ilike.%${t}%,national_id.ilike.%${t}%,mobile_number.ilike.%${t}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error(error);
        setIdListError(error.message || "Failed to load ID captures.");
        setIdCaptureList([]);
      } else {
        setIdCaptureList(data || []);
      }
    } catch (e) {
      setIdListError("Could not load ID captures. Check connection.");
      setIdCaptureList([]);
    } finally {
      setIdListLoading(false);
    }
  };

  const openIdCaptureDetail = async (id: string) => {
    setIdLoading(true);
    setIdMessage(null);
    try {
      const { data, error } = await supabase
        .from("id_captures")
        .select(
          "id, full_name, national_id, mobile_number, grower_number, bank_account_number, bank_name, bank_branch, id_front_image, id_back_image, bank_details_image, created_at"
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setIdMessage({
          type: "error",
          text: error?.message || "Could not open this record.",
        });
      } else {
        setIdSavedRecord({
          id: data.id,
          full_name: data.full_name,
          national_id: data.national_id,
          mobile_number: data.mobile_number || "",
          grower_number: data.grower_number || "",
          bank_account_number: data.bank_account_number || "",
          bank_name: data.bank_name || "",
          bank_branch: data.bank_branch || "",
          front_preview: data.id_front_image || "",
          back_preview: data.id_back_image || "",
          bank_preview: data.bank_details_image || "",
          created_at: data.created_at || "",
        });
        setIdViewMode("detail");
      }
    } catch {
      setIdMessage({ type: "error", text: "Failed to load record." });
    } finally {
      setIdLoading(false);
    }
  };

  const handleIdCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdMessage(null);

    if (!idForm.full_name.trim() || !idForm.national_id.trim()) {
      setIdMessage({
        type: "error",
        text: "Full name (as on ID) and National ID are required.",
      });
      return;
    }
    if (!idNameConfirmed) {
      setIdMessage({
        type: "error",
        text: "Please confirm that the name matches the one on the ID card.",
      });
      return;
    }
    if (!idFrontPreview || !idBackPreview) {
      setIdMessage({
        type: "error",
        text: "Please capture both the front and back of the National ID.",
      });
      return;
    }
    if (!idBankPreview) {
      setIdMessage({
        type: "error",
        text: "Please take or upload a photo of the bank details.",
      });
      return;
    }

    setIdLoading(true);
    try {
      const payload = {
        full_name: idForm.full_name.trim(),
        national_id: idForm.national_id.trim(),
        mobile_number: idForm.mobile_number.trim() || null,
        grower_number: null,
        bank_account_number: "See bank photo",
        bank_name: "See bank photo",
        bank_branch: null,
        id_front_image: idFrontPreview,
        id_back_image: idBackPreview,
        bank_details_image: idBankPreview,
        name_confirmed: true,
        captured_by: "clerk",
      };

      const { data, error } = await supabase
        .from("id_captures")
        .insert(payload)
        .select("id, created_at")
        .single();

      if (error) {
        setIdMessage({
          type: "error",
          text: error.message || "Failed to save ID capture. Check Supabase table/RLS.",
        });
      } else {
        setIdSavedRecord({
          id: data.id,
          full_name: payload.full_name,
          national_id: payload.national_id,
          mobile_number: payload.mobile_number || "",
          grower_number: payload.grower_number || "",
          bank_account_number: payload.bank_account_number,
          bank_name: payload.bank_name,
          bank_branch: payload.bank_branch || "",
          front_preview: idFrontPreview,
          back_preview: idBackPreview,
          bank_preview: idBankPreview,
          created_at: data.created_at || new Date().toISOString(),
        });
        setIdMessage({
          type: "success",
          text: "ID capture saved successfully. You can print or download the PDF below. It is now in the shared list.",
        });
        setIdViewMode("detail");
        fetchIdCaptures();
      }
    } catch {
      setIdMessage({ type: "error", text: "Something went wrong while saving." });
    } finally {
      setIdLoading(false);
    }
  };

  const handlePrintIdCapture = () => {
    // Opens print dialog — choose "Save as PDF" to download
    window.print();
  };

  const handleDownloadPdf = () => {
    // Same print path; browsers offer Save as PDF
    window.print();
  };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setUploadResult(null);
    setAdminMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setCsvPreview(parsed);
      if (parsed.length === 0) {
        setAdminMessage({
          type: "error",
          text: "No valid rows found. Check CSV headers and data.",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (csvPreview.length === 0) return;
    setUploadLoading(true);
    setAdminMessage(null);
    setUploadResult(null);

    try {
      // Deduplicate by national_id first (last row wins)
      // Fixes: ON CONFLICT DO UPDATE cannot affect row a second time
      const dedupe = new Map<string, (typeof csvPreview)[0]>();
      for (const f of csvPreview) {
        const nid = (f.national_id || "").trim();
        if (!nid) continue;
        dedupe.set(nid, f);
      }
      const uniqueRows = Array.from(dedupe.values());
      const dupesRemoved = csvPreview.length - uniqueRows.length;

      const chunkSize = 200;
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < uniqueRows.length; i += chunkSize) {
        const chunk = uniqueRows.slice(i, i + chunkSize).map((f) => ({
          grower_number: f.grower_number,
          name: f.name,
          national_id: f.national_id,
          mobile_number: f.mobile_number || null,
          buying_center: f.buying_center || null,
          route: f.route || null,
        }));

        const res = await fetch("/api/upload-farmers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        });

        const data = await res.json();

        if (!res.ok) {
          failedCount += chunk.length;
          errors.push(data.error || `HTTP ${res.status}`);
        } else {
          successCount += data.success || 0;
          failedCount += data.failed || 0;
          if (data.errors?.length) {
            errors.push(...data.errors.slice(0, 3));
          }
        }
      }

      setUploadResult({ success: successCount, failed: failedCount, errors });

      if (successCount > 0 && failedCount === 0) {
        setCsvPreview([]);
        setCsvFileName("");
        setAdminMessage({
          type: "success",
          text: `${successCount} farmer(s) uploaded successfully${
            dupesRemoved > 0
              ? ` (${dupesRemoved} duplicate National IDs skipped)`
              : ""
          }.`,
        });
      } else if (successCount > 0) {
        setAdminMessage({
          type: "error",
          text: `Uploaded ${successCount}, failed ${failedCount}. ${errors[0] || ""}`,
        });
      } else {
        setAdminMessage({
          type: "error",
          text:
            errors[0] ||
            "Upload failed. Check Supabase table, RLS policy, and API keys.",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error during upload";
      setUploadResult({ success: 0, failed: csvPreview.length, errors: [msg] });
      setAdminMessage({ type: "error", text: msg });
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Loading session ─────────────────────────────────────────────
  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-green-50">
        <div className="loader" />
        <p className="text-green-800 font-medium">Loading...</p>
      </div>
    );
  }

  // ── LOGIN SCREEN ────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-green-800 to-green-950">
        <div className="card p-8 w-full max-w-md shadow-xl">
          <div className="text-center mb-8">
            <div className="w-28 h-20 mx-auto mb-4 flex items-center justify-center">
              <img src="/logo.png" alt="Chebango Logo" className="max-h-20 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Farmers Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter password to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                autoFocus
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center">
                {authError}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Password is saved on this device after login
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-green-800 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                Farmers Portal
              </p>
              <p className="text-xs text-green-200">Chebango EPZ</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm bg-green-900 hover:bg-green-950 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Main tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex gap-1 bg-green-900/40 rounded-xl p-1">
            {(
              [
                { id: "home", label: "Home" },
                { id: "search", label: "Search Farmers" },
                { id: "id_capture", label: "ID Capture" },
                { id: "admin", label: "Admin Portal" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  mainTab === tab.id
                    ? "bg-white text-green-900 shadow"
                    : "text-green-100 hover:bg-green-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* Tab switch loader */}
        {tabLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="loader" />
            <p className="text-green-800 text-sm font-medium">Loading...</p>
          </div>
        )}

        {/* ═══════════════ HOME TAB ═══════════════ */}
        {!tabLoading && mainTab === "home" && (
          <div className="space-y-6">
            {/* Hero with YouTube background */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg h-56 sm:h-72">
              <iframe
                className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-150"
                src={`https://www.youtube.com/embed/${FACTORY_INFO.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${FACTORY_INFO.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                title="Factory video"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/90 via-green-900/50 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {FACTORY_NAME}
                  </h1>
                  <p className="text-green-100 text-sm mt-1">
                    Quality Tea • Supporting Farmers
                  </p>
                </div>
              </div>
            </div>

            {/* About + Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="card p-5">
                <h2 className="text-lg font-semibold text-green-900 mb-3">
                  About Us
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {FACTORY_INFO.about}
                </p>
              </div>

              <div className="card p-5">
                <h2 className="text-lg font-semibold text-green-900 mb-3">
                  Contact & Location
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Address</p>
                    <p className="text-gray-800 font-medium">
                      {FACTORY_INFO.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="text-gray-800 font-medium">
                      {FACTORY_INFO.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-gray-800 font-medium">
                      {FACTORY_INFO.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Website</p>
                    <p className="text-gray-800 font-medium">
                      {FACTORY_INFO.website}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Factory Gallery */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                Factory Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div
                    key={n}
                    className="aspect-video rounded-xl overflow-hidden border border-green-200 bg-green-50"
                  >
                    <img
                      src={`/gallery/${n}.png`}
                      alt={`Factory photo ${n}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ SEARCH TAB ═══════════════ */}
        {!tabLoading && mainTab === "search" && (
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verify Grower Number
              </h2>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType("national_id");
                      setSearchValue("");
                      setFarmer(null);
                      setSearchError("");
                      setSearched(false);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      searchType === "national_id"
                        ? "bg-green-700 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    National ID
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType("grower_number");
                      setSearchValue("");
                      setFarmer(null);
                      setSearchError("");
                      setSearched(false);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      searchType === "grower_number"
                        ? "bg-green-700 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Grower Number
                  </button>
                </div>

                <div>
                  <label className="label">
                    {searchType === "national_id"
                      ? "National ID Number"
                      : "Grower Number"}
                  </label>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="input text-lg"
                    placeholder={
                      searchType === "national_id"
                        ? "e.g. 12345678"
                        : "e.g. GR-00123"
                    }
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={searchLoading || !searchValue.trim()}
                  className="btn-primary w-full"
                >
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {searchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
                {searchError}
              </div>
            )}

            {farmer && (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-green-800 border-b border-green-100 pb-2">
                  Farmer Details
                </h2>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Grower Number
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {farmer.grower_number}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Name</p>
                    <p className="text-lg font-medium">{farmer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">National ID</p>
                    <p className="text-lg">{farmer.national_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Mobile Number</p>
                    <p className="text-lg">{farmer.mobile_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Buying Center
                    </p>
                    <p className="text-lg">{farmer.buying_center || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Route</p>
                    <p className="text-lg">{farmer.route || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {searched && !farmer && !searchError && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-center">
                No farmer found.
              </div>
            )}
          </div>
        )}

        
        
        {/* ═══════════════ ID CAPTURE TAB ═══════════════ */}
        {!tabLoading && mainTab === "id_capture" && (
          <div className="space-y-5">
            <div className="rounded-2xl overflow-hidden border border-green-200 shadow-sm bg-gradient-to-b from-green-50 to-white">
              <div className="bg-green-800 text-white px-6 py-4">
                <h2 className="text-lg font-semibold">
                  Farmer Registration — ID Capture
                </h2>
                <p className="text-sm text-green-100 mt-1">
                  Capture ID and bank photos, save a PDF, and browse all records
                  shared with everyone.
                </p>
              </div>

              <div className="px-4 pt-4 flex flex-wrap gap-2 border-b border-green-100 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setIdViewMode("form");
                    setIdSavedRecord(null);
                    setIdMessage(null);
                  }}
                  className={`px-4 py-2 text-sm rounded-t-lg font-medium ${
                    idViewMode === "form"
                      ? "bg-green-700 text-white"
                      : "bg-green-50 text-green-900"
                  }`}
                >
                  New capture
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdViewMode("list");
                    setIdSavedRecord(null);
                    fetchIdCaptures();
                  }}
                  className={`px-4 py-2 text-sm rounded-t-lg font-medium ${
                    idViewMode === "list"
                      ? "bg-green-700 text-white"
                      : "bg-green-50 text-green-900"
                  }`}
                >
                  All captures ({idCaptureList.length})
                </button>
              </div>

              <div className="p-6">
              {idMessage && (
                <div
                  className={`mb-4 rounded-xl p-3 text-sm ${
                    idMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {idMessage.text}
                </div>
              )}

              {idViewMode === "list" && !idSavedRecord && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Shared ID capture records
                      </h3>
                      <p className="text-sm text-gray-500">
                        Everyone can open a record and download / print the PDF.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        className="input max-w-xs"
                        placeholder="Search name or ID..."
                        value={idListSearch}
                        onChange={(e) => setIdListSearch(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={fetchIdCaptures}
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setIdViewMode("form");
                          setIdSavedRecord(null);
                        }}
                      >
                        New capture
                      </button>
                    </div>
                  </div>

                  {idListError && (
                    <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">
                      {idListError}
                      <p className="text-xs mt-1">
                        If this persists, run in Supabase SQL:{" "}
                        <code>alter table public.id_captures disable row level security;</code>
                      </p>
                    </div>
                  )}

                  {idListLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="loader" />
                    </div>
                  ) : idCaptureList.length === 0 ? (
                    <p className="text-center text-gray-500 py-10 text-sm">
                      No ID captures saved yet. Use &quot;New capture&quot; to add one.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border rounded-xl">
                      <table className="min-w-full text-sm">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                              Date
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                              Full Name
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                              National ID
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                              Mobile
                            </th>
                            <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {idCaptureList.map((row) => (
                            <tr
                              key={row.id}
                              className="border-t hover:bg-green-50/50"
                            >
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                {row.created_at
                                  ? new Date(row.created_at).toLocaleString()
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {row.full_name}
                              </td>
                              <td className="px-3 py-2">{row.national_id}</td>
                              <td className="px-3 py-2">
                                {row.mobile_number || "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  className="text-sm px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800"
                                  onClick={() => openIdCaptureDetail(row.id)}
                                  disabled={idLoading}
                                >
                                  View / PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {idViewMode === "form" && !idSavedRecord && (
                <form onSubmit={handleIdCaptureSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Full Name (exactly as on ID){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={idForm.full_name}
                        onChange={(e) =>
                          setIdForm({ ...idForm, full_name: e.target.value })
                        }
                        placeholder="Name as printed on National ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        National ID Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={idForm.national_id}
                        onChange={(e) =>
                          setIdForm({ ...idForm, national_id: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Mobile Number</label>
                      <input
                        type="text"
                        className="input"
                        value={idForm.mobile_number}
                        onChange={(e) =>
                          setIdForm({ ...idForm, mobile_number: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-green-100 pt-4">
                    <h3 className="font-medium text-green-900 mb-1">
                      Bank details photo <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Take a photo of the bank card, slip, or statement — or upload
                      from the gallery. No need to type account number or bank name.
                      You can crop the photo after capture.
                    </p>
                    <div className="space-y-2 rounded-xl border border-green-100 bg-white p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary text-sm"
                          onClick={() => openCamera("bank")}
                        >
                          Take photo
                        </button>
                        <label className="btn-outline text-sm cursor-pointer inline-block">
                          From gallery
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIdBankChange}
                            className="hidden"
                          />
                        </label>
                        {idBankPreview && (
                          <button
                            type="button"
                            className="text-sm px-3 py-1.5 rounded-lg border border-green-600 text-green-800"
                            onClick={() => openCrop("bank", idBankPreview)}
                          >
                            Crop background
                          </button>
                        )}
                      </div>
                      {idBankPreview && (
                        <img
                          src={idBankPreview}
                          alt="Bank details"
                          className="mt-2 rounded-lg border max-h-48 object-contain bg-gray-50 w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div className="border-t border-green-100 pt-4">
                    <h3 className="font-medium text-green-900 mb-1">
                      National ID photos
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      After taking or uploading a photo, use <strong>Crop background</strong>{" "}
                      to keep only the ID card and remove extra background.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 rounded-xl border border-green-100 bg-white p-3">
                        <label className="label">
                          Front of ID <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            onClick={() => openCamera("front")}
                          >
                            Take photo
                          </button>
                          <label className="btn-outline text-sm cursor-pointer inline-block">
                            From gallery
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdFrontChange}
                              className="hidden"
                            />
                          </label>
                          {idFrontPreview && (
                            <button
                              type="button"
                              className="text-sm px-3 py-1.5 rounded-lg border border-green-600 text-green-800"
                              onClick={() => openCrop("front", idFrontPreview)}
                            >
                              Crop background
                            </button>
                          )}
                        </div>
                        {idFrontPreview && (
                          <img
                            src={idFrontPreview}
                            alt="ID Front"
                            className="mt-2 rounded-lg border max-h-52 object-contain bg-gray-50 w-full"
                          />
                        )}
                      </div>
                      <div className="space-y-2 rounded-xl border border-green-100 bg-white p-3">
                        <label className="label">
                          Back of ID <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            onClick={() => openCamera("back")}
                          >
                            Take photo
                          </button>
                          <label className="btn-outline text-sm cursor-pointer inline-block">
                            From gallery
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdBackChange}
                              className="hidden"
                            />
                          </label>
                          {idBackPreview && (
                            <button
                              type="button"
                              className="text-sm px-3 py-1.5 rounded-lg border border-green-600 text-green-800"
                              onClick={() => openCrop("back", idBackPreview)}
                            >
                              Crop background
                            </button>
                          )}
                        </div>
                        {idBackPreview && (
                          <img
                            src={idBackPreview}
                            alt="ID Back"
                            className="mt-2 rounded-lg border max-h-52 object-contain bg-gray-50 w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={idNameConfirmed}
                      onChange={(e) => setIdNameConfirmed(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-800">
                      I confirm that the name{" "}
                      <strong className="text-green-900">
                        {idForm.full_name || "—"}
                      </strong>{" "}
                      matches the National ID.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={idLoading}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {idLoading ? "Saving..." : "Save & generate PDF"}
                  </button>
                </form>
              )}

              {(idViewMode === "detail" || idSavedRecord) && idSavedRecord && (
                <div className="space-y-4">
                  <div
                    id="id-capture-print"
                    className="bg-white rounded-xl overflow-hidden border-2 border-green-700"
                  >
                    <div className="bg-green-800 text-white px-6 py-5 text-center">
                      <p className="text-xs uppercase tracking-wider text-green-200">
                        Chebango EPZ Tea Factory
                      </p>
                      <h3 className="text-xl font-bold mt-1">
                        Farmer Registration — ID Capture Record
                      </h3>
                      <p className="text-xs text-green-200 mt-2">
                        Ref: {idSavedRecord.id.slice(0, 8).toUpperCase()} ·{" "}
                        {new Date(idSavedRecord.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-b from-green-50/80 to-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                        <div className="bg-white rounded-lg border border-green-100 p-3">
                          <p className="text-xs text-gray-500 uppercase">Full Name</p>
                          <p className="font-semibold text-green-900">
                            {idSavedRecord.full_name}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg border border-green-100 p-3">
                          <p className="text-xs text-gray-500 uppercase">National ID</p>
                          <p className="font-semibold">{idSavedRecord.national_id}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-green-100 p-3 sm:col-span-2">
                          <p className="text-xs text-gray-500 uppercase">Mobile</p>
                          <p>{idSavedRecord.mobile_number || "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg border border-green-200 p-3">
                          <p className="text-xs text-green-800 font-medium uppercase mb-2">
                            ID Front
                          </p>
                          <img
                            src={idSavedRecord.front_preview}
                            alt="ID Front"
                            className="rounded border max-h-56 object-contain w-full bg-gray-50"
                          />
                        </div>
                        <div className="bg-white rounded-lg border border-green-200 p-3">
                          <p className="text-xs text-green-800 font-medium uppercase mb-2">
                            ID Back
                          </p>
                          <img
                            src={idSavedRecord.back_preview}
                            alt="ID Back"
                            className="rounded border max-h-56 object-contain w-full bg-gray-50"
                          />
                        </div>
                        {idSavedRecord.bank_preview && (
                          <div className="sm:col-span-2 bg-white rounded-lg border border-green-200 p-3">
                            <p className="text-xs text-green-800 font-medium uppercase mb-2">
                              Bank Details Photo
                            </p>
                            <img
                              src={idSavedRecord.bank_preview}
                              alt="Bank"
                              className="rounded border max-h-56 object-contain w-full bg-gray-50"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-4 text-center border-t border-green-100 pt-3">
                        Name confirmed · Chebango EPZ Tea Factory Farmers Portal
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 print:hidden">
                    <button type="button" onClick={handleDownloadPdf} className="btn-primary">
                      Download / Save as PDF
                    </button>
                    <button type="button" onClick={handlePrintIdCapture} className="btn-secondary">
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetIdForm();
                        setIdViewMode("form");
                      }}
                      className="btn-outline"
                    >
                      Capture another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIdSavedRecord(null);
                        setIdViewMode("list");
                        fetchIdCaptures();
                      }}
                      className="btn-secondary"
                    >
                      Back to all captures
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 print:hidden">
                    Use <strong>Download / Save as PDF</strong> → choose &quot;Save as PDF&quot;
                    in the print dialog.
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

{/* ═══════════════ ADMIN PORTAL ═══════════════ */}
        {!tabLoading && mainTab === "admin" && (
          <div>
            {!isAdminUnlocked ? (
              <div className="card p-8 max-w-md mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Admin Portal
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Enter the admin password to continue
                </p>

                <form onSubmit={handleAdminUnlock} className="space-y-4 text-left">
                  <div>
                    <label className="label">Admin Password</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="input"
                      placeholder="Enter admin password"
                      autoFocus
                    />
                  </div>
                  {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center">
                      {authError}
                    </div>
                  )}
                  <button type="submit" className="btn-primary w-full">
                    Unlock Admin
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-green-900">
                    Admin Portal
                  </h2>
                  <button
                    onClick={() => setIsAdminUnlocked(false)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Lock Admin
                  </button>
                </div>

                <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-green-100">
                  {(
                    [
                      { id: "upload", label: "CSV Upload" },
                      { id: "add", label: "Add Farmer" },
                      { id: "delete", label: "Delete Farmers" },
                      { id: "list", label: "View Farmers" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setAdminSubTab(t.id);
                        setAdminMessage(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                        adminSubTab === t.id
                          ? "bg-green-700 text-white shadow"
                          : "text-gray-600 hover:bg-green-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {adminMessage && (
                  <div
                    className={`rounded-xl p-4 text-sm ${
                      adminMessage.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                  >
                    {adminMessage.text}
                  </div>
                )}

                {adminSubTab === "upload" && (
                  <div className="card p-6 space-y-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Upload Farmers CSV
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Existing records with the same National ID will be
                        updated.
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 text-sm">
                      <p className="font-medium text-green-900 mb-1">
                        Expected columns:
                      </p>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-green-200">
                        Grower No. (or GROWER NO.), Farmer Name (or First/Middle/Last Name), ID No. (or ID Number), mobile number — optional: Buying Center, Route, date
                      </code>
                    </div>

                    <div>
                      <label className="label">Select CSV file</label>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {csvFileName && (
                        <p className="text-sm text-gray-600 mt-2">
                          {csvFileName} — {csvPreview.length} valid row(s)
                        </p>
                      )}
                    </div>

                    {csvPreview.length > 0 && (
                      <>
                        <div className="overflow-x-auto border rounded-xl">
                          <table className="min-w-full text-sm">
                            <thead className="bg-green-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  Grower No
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  Name
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  National ID
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  Center
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  Route
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.slice(0, 8).map((f, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-3 py-2">
                                    {f.grower_number}
                                  </td>
                                  <td className="px-3 py-2">{f.name}</td>
                                  <td className="px-3 py-2">
                                    {f.national_id}
                                  </td>
                                  <td className="px-3 py-2">
                                    {f.buying_center || "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {f.route || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {csvPreview.length > 8 && (
                          <p className="text-xs text-gray-500">
                            … and {csvPreview.length - 8} more rows
                          </p>
                        )}
                        <button
                          onClick={handleCsvUpload}
                          disabled={uploadLoading}
                          className="btn-primary"
                        >
                          {uploadLoading
                            ? "Uploading..."
                            : `Upload ${csvPreview.length} Farmer(s)`}
                        </button>
                      </>
                    )}

                    {uploadResult && (
                      <div
                        className={`rounded-xl p-4 text-sm ${
                          uploadResult.failed === 0
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-900"
                        }`}
                      >
                        <strong>{uploadResult.success}</strong> uploaded.
                        {uploadResult.failed > 0 && (
                          <>
                            {" "}
                            <strong>{uploadResult.failed}</strong> failed.
                          </>
                        )}
                        {uploadResult.errors?.length > 0 && (
                          <div className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                            Error: {uploadResult.errors.slice(0, 3).join(" | ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {adminSubTab === "add" && (
                  <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Add / Update Farmer
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      Same National ID will update the existing record.
                    </p>

                    <form
                      onSubmit={handleAddFarmer}
                      className="space-y-4 max-w-xl"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            Grower Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newFarmer.grower_number}
                            onChange={(e) =>
                              setNewFarmer({
                                ...newFarmer,
                                grower_number: e.target.value,
                              })
                            }
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">
                            National ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newFarmer.national_id}
                            onChange={(e) =>
                              setNewFarmer({
                                ...newFarmer,
                                national_id: e.target.value,
                              })
                            }
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newFarmer.name}
                          onChange={(e) =>
                            setNewFarmer({ ...newFarmer, name: e.target.value })
                          }
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Mobile Number</label>
                        <input
                          type="text"
                          value={newFarmer.mobile_number}
                          onChange={(e) =>
                            setNewFarmer({
                              ...newFarmer,
                              mobile_number: e.target.value,
                            })
                          }
                          className="input"
                          placeholder="e.g. 0740123456"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Buying Center</label>
                          <input
                            type="text"
                            value={newFarmer.buying_center}
                            onChange={(e) =>
                              setNewFarmer({
                                ...newFarmer,
                                buying_center: e.target.value,
                              })
                            }
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Route</label>
                          <input
                            type="text"
                            value={newFarmer.route}
                            onChange={(e) =>
                              setNewFarmer({
                                ...newFarmer,
                                route: e.target.value,
                              })
                            }
                            className="input"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={addLoading}
                        className="btn-primary"
                      >
                        {addLoading ? "Saving..." : "Save Farmer"}
                      </button>
                    </form>
                  </div>
                )}

                
                {adminSubTab === "delete" && (
                  <div className="card p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Delete Farmers
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Remove defaulted or inactive farmers. Tick the checkbox
                        for each farmer, or select all, then delete.
                      </p>
                    </div>

                    {adminMessage && (
                      <div
                        className={`rounded-xl p-3 text-sm ${
                          adminMessage.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {adminMessage.text}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={listSearch}
                          onChange={(e) => setListSearch(e.target.value)}
                          placeholder="Search name, ID or grower no..."
                          className="input max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={fetchFarmers}
                          className="btn-secondary"
                        >
                          Search / Refresh
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          disabled={farmers.length === 0}
                          className="text-sm px-3 py-2 rounded-lg border border-green-600 text-green-800 hover:bg-green-50 disabled:opacity-40"
                        >
                          {selectedIds.length === farmers.length &&
                          farmers.length > 0
                            ? "Deselect all"
                            : "Select all"}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          disabled={selectedIds.length === 0 || bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                        >
                          {bulkDeleting
                            ? "Deleting..."
                            : `Delete selected (${selectedIds.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAllLoaded}
                          disabled={farmers.length === 0 || bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-medium"
                        >
                          Delete all shown ({farmers.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteEntireDatabase}
                          disabled={bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 font-semibold"
                        >
                          {bulkDeleting
                            ? "Deleting..."
                            : "Delete ALL farmers in database"}
                        </button>
                      </div>
                    </div>

                    {listLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="loader" />
                      </div>
                    ) : farmers.length === 0 ? (
                      <p className="text-gray-500 text-sm py-8 text-center">
                        No farmers found.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border rounded-xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-red-50">
                            <tr>
                              <th className="px-3 py-2.5 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    farmers.length > 0 &&
                                    selectedIds.length === farmers.length
                                  }
                                  onChange={toggleSelectAll}
                                />
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Grower No
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Name
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                National ID
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Center
                              </th>
                              <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {farmers.map((f, i) => (
                              <tr
                                key={f.national_id || i}
                                className="border-t hover:bg-red-50/40"
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(
                                      f.national_id
                                    )}
                                    onChange={() =>
                                      toggleSelectFarmer(f.national_id)
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 font-medium">
                                  {f.grower_number}
                                </td>
                                <td className="px-3 py-2">{f.name}</td>
                                <td className="px-3 py-2">{f.national_id}</td>
                                <td className="px-3 py-2">
                                  {f.buying_center || "—"}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteFarmer(
                                        f.national_id,
                                        f.name
                                      )
                                    }
                                    disabled={deletingId === f.national_id}
                                    className="text-red-600 hover:bg-red-50 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-red-200 disabled:opacity-50"
                                  >
                                    {deletingId === f.national_id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Tip: Search for a defaulted farmer, tick the box, then
                      &quot;Delete selected&quot;. Use &quot;Delete all shown&quot;
                      only when the filtered list is correct.
                    </p>
                  </div>
                )}

{adminSubTab === "list" && (
                  <div className="card p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          All Farmers
                        </h3>
                        <p className="text-sm text-gray-500">
                          {totalCount} record(s)
                          {selectedIds.length > 0 && (
                            <span className="text-red-600">
                              {" "}
                              · {selectedIds.length} selected
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={listSearch}
                          onChange={(e) => setListSearch(e.target.value)}
                          placeholder="Search..."
                          className="input max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={fetchFarmers}
                          className="btn-secondary whitespace-nowrap"
                        >
                          Refresh
                        </button>
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          disabled={farmers.length === 0}
                          className="text-sm px-3 py-2 rounded-lg border border-green-600 text-green-800 hover:bg-green-50 disabled:opacity-40"
                        >
                          {selectedIds.length === farmers.length &&
                          farmers.length > 0
                            ? "Deselect all"
                            : "Select all"}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          disabled={selectedIds.length === 0 || bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40"
                        >
                          {bulkDeleting
                            ? "Deleting..."
                            : `Delete selected (${selectedIds.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAllLoaded}
                          disabled={farmers.length === 0 || bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg border border-red-500 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 font-medium"
                        >
                          Delete all shown ({farmers.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteEntireDatabase}
                          disabled={bulkDeleting}
                          className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 font-semibold"
                        >
                          {bulkDeleting
                            ? "Deleting..."
                            : "Delete ALL in database"}
                        </button>
                      </div>
                    </div>

                    {listLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="loader" />
                      </div>
                    ) : farmers.length === 0 ? (
                      <p className="text-gray-500 text-sm py-8 text-center">
                        No farmers found.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border rounded-xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-3 py-2.5 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    farmers.length > 0 &&
                                    selectedIds.length === farmers.length
                                  }
                                  onChange={toggleSelectAll}
                                  title="Select all"
                                />
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Grower No
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Name
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                National ID
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Center
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                                Route
                              </th>
                              <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {farmers.map((f, i) => (
                              <tr
                                key={f.national_id || i}
                                className="border-t hover:bg-green-50/50"
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(
                                      f.national_id
                                    )}
                                    onChange={() =>
                                      toggleSelectFarmer(f.national_id)
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 font-medium">
                                  {f.grower_number}
                                </td>
                                <td className="px-3 py-2">{f.name}</td>
                                <td className="px-3 py-2">{f.national_id}</td>
                                <td className="px-3 py-2">
                                  {f.buying_center || "—"}
                                </td>
                                <td className="px-3 py-2">{f.route || "—"}</td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteFarmer(
                                        f.national_id,
                                        f.name
                                      )
                                    }
                                    disabled={deletingId === f.national_id}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-red-200 disabled:opacity-50"
                                  >
                                    {deletingId === f.national_id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>


      
      {/* Crop modal — remove unwanted background */}
      {cropOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-green-900">
                Crop — keep only the needed part
              </h3>
              <button
                type="button"
                className="text-sm text-gray-500"
                onClick={() => {
                  setCropOpen(false);
                  setCropTarget(null);
                }}
              >
                Cancel
              </button>
            </div>
            <div className="bg-gray-900 aspect-[4/3] relative overflow-hidden flex items-center justify-center">
              {cropSource && (
                <img
                  src={cropSource}
                  alt="Crop"
                  className="max-w-none"
                  style={{
                    transform: `translate(${cropOffsetX * 0.3}px, ${cropOffsetY * 0.3}px) scale(${cropZoom})`,
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
              <div className="pointer-events-none absolute inset-6 border-2 border-green-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600">Zoom (crop tighter)</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Move left / right</label>
                <input
                  type="range"
                  min={-300}
                  max={300}
                  step={5}
                  value={cropOffsetX}
                  onChange={(e) => setCropOffsetX(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Move up / down</label>
                <input
                  type="range"
                  min={-300}
                  max={300}
                  step={5}
                  value={cropOffsetY}
                  onChange={(e) => setCropOffsetY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCropOpen(false);
                    setCropTarget(null);
                  }}
                >
                  Skip crop
                </button>
                <button type="button" className="btn-primary" onClick={applyCrop}>
                  Apply crop
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Zoom in and move the image so only the ID card (or bank document)
                sits inside the green frame. Extra background is cut off.
              </p>
            </div>
          </div>
        </div>
      )}

{/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-green-900">
                {cameraTarget === "front"
                  ? "Capture ID Front"
                  : cameraTarget === "back"
                    ? "Capture ID Back"
                    : "Capture Bank Details"}
              </h3>
              <button
                type="button"
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                Close
              </button>
            </div>
            <div className="bg-black aspect-video relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            {cameraError && (
              <p className="text-red-600 text-sm px-4 py-2">{cameraError}</p>
            )}
            <div className="p-4 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={snapCameraPhoto}
                className="btn-primary"
                disabled={!!cameraError}
              >
                Capture photo
              </button>
              <button type="button" onClick={closeCamera} className="btn-secondary">
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center pb-3 px-4">
              Allow camera access when the browser asks. If camera fails, use From
              gallery instead.
            </p>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-green-700/60 py-4">
        Chebango EPZ Tea Factory • Farmers Portal
      </footer>
    </div>
  );
}

export type UserRole = "admin" | "viewer";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  file_count?: number;
}

export interface ExcelDocument {
  id: string;
  title: string;
  file_name: string | null;
  description: string;
  source_type: "upload" | "drive";
  drive_kind: "file" | "folder";
  drive_file_id: string | null;
  drive_url: string | null;
  drive_modified_time: string | null;
  folder_id: string | null;
  file_size: number | null;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  sheet_count: number;
  total_rows: number;
  uploaded_by: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Sheet setelah dibersihkan ala wakaka2.html */
export interface ParsedSheet {
  sheetName: string;
  titles: string[];
  headers: string[];
  rows: string[][];
}

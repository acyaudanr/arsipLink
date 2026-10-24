import * as XLSX from "xlsx";
import type { ParsedSheet } from "@/lib/types";

type AOA = unknown[][];

/**
 * Persis logika wakaka2.html → cleanRawSheetDataWithTitles:
 * cari baris header asli (No/Uraian/Nomor/Kode), judul di atas jadi banner,
 * buang kolom kosong, header kosong diganti "Kolom A/B/...".
 */
function cleanRawSheetDataWithTitles(rawData: AOA): {
  titles: string[];
  headers: string[];
  rows: string[][];
} {
  if (!rawData || rawData.length === 0) return { titles: [], headers: [], rows: [] };

  let tableHeaderRowIndex = -1;

  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r];
    if (row && Array.isArray(row)) {
      const rowText = row.join(" ").toLowerCase();
      const filled = row.filter(
        (c) => c !== undefined && c !== null && String(c).trim() !== ""
      ).length;
      if (
        (rowText.includes("no") ||
          rowText.includes("uraian") ||
          rowText.includes("nomor") ||
          rowText.includes("kode")) &&
        filled >= 3
      ) {
        tableHeaderRowIndex = r;
        break;
      }
    }
  }

  if (tableHeaderRowIndex === -1) {
    for (let r = 0; r < rawData.length; r++) {
      const row = rawData[r];
      if (
        row &&
        row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== "")
      ) {
        tableHeaderRowIndex = r;
        break;
      }
    }
  }

  if (tableHeaderRowIndex === -1) return { titles: [], headers: [], rows: [] };

  const titles: string[] = [];
  for (let r = 0; r < tableHeaderRowIndex; r++) {
    const row = rawData[r];
    if (row) {
      const texts = row
        .map((c) => (c !== undefined && c !== null ? String(c).trim() : ""))
        .filter((t) => t !== "");
      if (texts.length > 0) titles.push(texts.join(" "));
    }
  }

  const slicedData = rawData.slice(tableHeaderRowIndex);
  if (slicedData.length === 0) return { titles, headers: [], rows: [] };

  const rawHeader = slicedData[0] || [];
  const validColIndices: number[] = [];
  for (let colIdx = 0; colIdx < rawHeader.length; colIdx++) {
    const headerText =
      rawHeader[colIdx] !== undefined && rawHeader[colIdx] !== null
        ? String(rawHeader[colIdx]).trim()
        : "";
    let hasDataInBody = false;
    for (let rowIdx = 1; rowIdx < slicedData.length; rowIdx++) {
      const cellVal = slicedData[rowIdx]?.[colIdx];
      if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== "") {
        hasDataInBody = true;
        break;
      }
    }
    if (headerText !== "" || hasDataInBody) validColIndices.push(colIdx);
  }

  const cleanedRows = slicedData.map((row) =>
    validColIndices.map((colIdx) => {
      const v = row?.[colIdx];
      return v !== undefined && v !== null ? String(v) : "";
    })
  );

  const headerRow = cleanedRows[0] || [];
  const headers = headerRow.map((val, i) => {
    const s = String(val ?? "").trim();
    return s !== "" ? s : `Kolom ${String.fromCharCode(65 + (i % 26))}`;
  });

  const rows = cleanedRows.slice(1);
  return { titles, headers, rows };
}

/** Parse buffer Excel/CSV → sheet bersih ala wakaka2 (SheetJS). */
export async function parseExcelBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array
): Promise<ParsedSheet[]> {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  const workbook = XLSX.read(data, { type: "array", cellDates: true });
  const sheets: ParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      range.s.r = 0;
      range.s.c = 0;
      worksheet["!ref"] = XLSX.utils.encode_range(range);
    }

    const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as AOA;

    const cleaned = cleanRawSheetDataWithTitles(rawData);
    sheets.push({
      sheetName,
      titles: cleaned.titles,
      headers: cleaned.headers,
      rows: cleaned.rows,
    });
  }

  return sheets;
}

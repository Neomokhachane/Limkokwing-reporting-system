import * as XLSX from "xlsx";

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const friendlyHeader = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());

const normalizeRows = (data) =>
  data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        friendlyHeader(key),
        value?.toDate ? value.toDate().toISOString().slice(0, 10) : value ?? "",
      ])
    )
  );

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  
  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(data, filename, sheetName = "Report") {
  if (!data || data.length === 0) return;

  const rows = normalizeRows(data);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  worksheet["!cols"] = Array.from({ length: range.e.c + 1 }, () => ({ wch: 24 }));
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) cell.s = { font: { bold: true } };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : `${filename}_${timestamp()}.xlsx`
  );
}

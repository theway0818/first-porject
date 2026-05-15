"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

// 엑셀 열 헤더 → DB 필드 매핑
const COLUMN_MAP: Record<string, string> = {
  "제품명":              "productName",
  "상품군":              "category",
  "보관방법":            "storageType",
  "업체명":              "supplierName",
  "담당자":              "supplierContact",
  "연락처":              "supplierPhone",
  "이메일":              "supplierEmail",
  "소비기한":            "shelfLife",
  "리드타임(일)":        "leadTime",
  "월예상사용량":        "monthlyUsage",
  "초도입고수량":        "initialOrderQty",
  "CJ납기요청일":        "cjDeliveryDate",
  "과세여부":            "taxType",
  "날개중량(g)":         "unitWeight",
  "팩박스입수량":        "packBoxQty",
  "요청유형":            "requestType",
  "요청팀":              "requestTeam",
  "요청자명":            "requesterName",
  "비고":                "note",
};

const REQUIRED = ["productName", "supplierName", "requestTeam", "requesterName"];

type ParsedRow = Record<string, string | number | null>;

function downloadTemplate() {
  const headers = Object.keys(COLUMN_MAP);
  const example = [
    "아사이베리베이스 2kg", "음료베이스", "냉동", "(주)베리팜", "홍길동",
    "02-1234-5678", "berry@farm.co.kr", "제조일로부터 12개월", "7",
    "100", "200", "2026-06-01", "과세", "2000", "6",
    "NEW", "메뉴개발팀", "김팀장", "초도 입고 주의",
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "코드요청");
  XLSX.writeFile(wb, "코드요청_양식.xlsx");
}

export default function ExcelUpload({ onSuccess }: { onSuccess: (count: number) => void }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function parseFile(file: File) {
    setErrors([]);
    setRows([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (raw.length < 2) { setErrors(["파일에 데이터가 없습니다."]); return; }

        const headers = (raw[0] as string[]).map((h) => String(h).trim());
        const errs: string[] = [];

        const parsed: ParsedRow[] = raw.slice(1).filter((r) =>
          (r as unknown[]).some((cell) => cell !== "" && cell != null)
        ).map((r, ri) => {
          const row: ParsedRow = {};
          headers.forEach((h, ci) => {
            const field = COLUMN_MAP[h];
            if (!field) return;
            const val = (r as unknown[])[ci];
            // 날짜 처리
            if (field === "cjDeliveryDate" && val instanceof Date) {
              row[field] = val.toISOString().split("T")[0];
            } else {
              row[field] = val !== "" && val != null ? String(val) : null;
            }
          });
          // 필수 필드 검증
          REQUIRED.forEach((f) => {
            if (!row[f]) errs.push(`${ri + 2}행: '${Object.keys(COLUMN_MAP).find((k) => COLUMN_MAP[k] === f)}' 필수 항목이 비어 있습니다.`);
          });
          return row;
        });

        setErrors(errs);
        setRows(parsed);
      } catch {
        setErrors(["파일을 읽는 중 오류가 발생했습니다. 올바른 엑셀 파일인지 확인하세요."]);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrors(["xlsx 또는 xls 파일만 업로드 가능합니다."]);
      return;
    }
    parseFile(file);
  }

  async function handleSubmit() {
    if (rows.length === 0 || errors.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/code-requests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (!res.ok) { setErrors(["서버 오류로 등록에 실패했습니다."]); return; }
      const data = await res.json();
      setRows([]);
      setFileName("");
      onSuccess(data.count);
    } catch {
      setErrors(["네트워크 오류가 발생했습니다."]);
    } finally {
      setLoading(false);
    }
  }

  const PREVIEW_COLS = ["productName", "supplierName", "requestTeam", "requesterName", "storageType", "cjDeliveryDate"];
  const PREVIEW_LABELS: Record<string, string> = {
    productName: "제품명", supplierName: "업체명", requestTeam: "요청팀",
    requesterName: "요청자", storageType: "보관", cjDeliveryDate: "납기일",
  };

  return (
    <div className="space-y-5">
      {/* 템플릿 다운로드 */}
      <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div>
          <div className="font-medium text-sm text-[#6B4226]">엑셀 양식 다운로드</div>
          <div className="text-xs text-gray-500 mt-0.5">양식에 맞춰 작성 후 업로드하세요</div>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#6B4226] text-white text-sm rounded-lg hover:bg-[#8B5A3A] transition-colors"
        >
          ⬇ 양식 다운로드
        </button>
      </div>

      {/* 파일 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${isDragOver ? "border-amber-400 bg-amber-50" : "border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {fileName ? (
          <div>
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-800">{fileName}</div>
            <div className="text-sm text-gray-500 mt-1">클릭하여 다른 파일 선택</div>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📂</div>
            <div className="font-medium text-gray-600">엑셀 파일을 끌어다 놓거나 클릭하세요</div>
            <div className="text-sm text-gray-400 mt-1">.xlsx, .xls 파일 지원</div>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="font-medium text-red-700 mb-2">⚠ 확인이 필요한 항목</div>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-sm text-red-600">• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 미리보기 테이블 */}
      {rows.length > 0 && errors.length === 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-gray-700">미리보기 ({rows.length}건)</span>
            <span className="text-xs text-gray-400">주요 항목만 표시됩니다</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#6B4226] text-white">
                  <th className="px-3 py-2 text-left font-medium w-8">#</th>
                  {PREVIEW_COLS.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{PREVIEW_LABELS[c]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    {PREVIEW_COLS.map((c) => (
                      <td key={c} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">
                        {row[c] ?? <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <div className="text-center text-xs text-gray-400 py-2 bg-gray-50">
                외 {rows.length - 10}건 더 있음
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full bg-[#6B4226] text-white py-3 rounded-2xl font-bold text-base hover:bg-[#8B5A3A] transition-colors disabled:opacity-60 shadow-md"
          >
            {loading ? "등록 중..." : `📊 ${rows.length}건 일괄 등록하기`}
          </button>
        </div>
      )}
    </div>
  );
}

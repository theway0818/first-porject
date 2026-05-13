"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-stone-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 print:hidden"
    >
      🖨️ PDF 다운로드
    </button>
  );
}

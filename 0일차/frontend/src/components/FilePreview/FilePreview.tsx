import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as XLSX from 'xlsx';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface FileInfo {
  id: number;
  original_name: string;
  mime_type: string;
  filename: string;
}

interface Props {
  file: FileInfo;
  onClose: () => void;
}

export default function FilePreview({ file, onClose }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [excelData, setExcelData] = useState<string[][]>([]);
  const [wordHtml, setWordHtml] = useState('');

  const previewUrl = `/api/files/${file.id}/preview`;
  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  const isExcel = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel', 'text/csv'].includes(file.mime_type);
  const isWord = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'].includes(file.mime_type);
  const isPpt = ['application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'].includes(file.mime_type);

  useEffect(() => {
    if (isExcel) {
      fetch(previewUrl, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          const wb = XLSX.read(buf);
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
          setExcelData(rows as string[][]);
        });
    }
    if (isWord) {
      fetch(previewUrl, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        .then((r) => r.arrayBuffer())
        .then(async (buf) => {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          setWordHtml(result.value);
        });
    }
  }, [file.id, isExcel, isWord, previewUrl]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 truncate">{file.original_name}</h3>
          <div className="flex items-center gap-3">
            <a
              href={`/api/files/${file.id}/download`}
              download={file.original_name}
              className="text-sm text-indigo-600 hover:underline"
            >
              다운로드
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage && <img src={previewUrl} alt={file.original_name} className="max-w-full mx-auto" />}

          {isPdf && (
            <div className="flex flex-col items-center gap-2">
              <Document
                file={previewUrl}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                options={{ httpHeaders: { Authorization: `Bearer ${localStorage.getItem('token')}` } }}
              >
                <Page pageNumber={page} width={700} />
              </Document>
              {numPages > 1 && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">◀</button>
                  <span>{page} / {numPages}</span>
                  <button disabled={page >= numPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">▶</button>
                </div>
              )}
            </div>
          )}

          {isExcel && (
            <div className="overflow-auto">
              <table className="text-xs border-collapse w-full">
                <tbody>
                  {excelData.slice(0, 100).map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-gray-200 px-2 py-1 whitespace-nowrap">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelData.length > 100 && <p className="text-xs text-gray-400 mt-2">처음 100행만 표시됩니다.</p>}
            </div>
          )}

          {isWord && (
            <div
              className="prose max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          )}

          {isPpt && (
            <div className="text-center text-gray-500 py-16">
              <p className="text-4xl mb-4">📊</p>
              <p className="font-medium">PPT 미리보기는 지원되지 않습니다</p>
              <p className="text-sm text-gray-400 mt-2">다운로드 후 확인해주세요</p>
              <a
                href={`/api/files/${file.id}/download`}
                className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                다운로드
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

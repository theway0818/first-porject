"use client";

interface ScqaData {
  situation: string[];
  complication: string[];
  question: string[];
  action: string[];
}

interface ScqaReportProps {
  data: ScqaData;
}

export default function ScqaReport({ data }: ScqaReportProps) {
  const sections = [
    { key: "S", label: "Situation (현황)", items: data.situation, color: "bg-blue-50 border-blue-200 text-blue-900" },
    { key: "C", label: "Complication (이슈)", items: data.complication, color: "bg-red-50 border-red-200 text-red-900" },
    { key: "Q", label: "Question (결정 필요)", items: data.question, color: "bg-yellow-50 border-yellow-200 text-yellow-900" },
    { key: "A", label: "Answer (핵심 액션)", items: data.action, color: "bg-green-50 border-green-200 text-green-900" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((s) => (
        <div key={s.key} className={`border-2 rounded-xl p-5 ${s.color}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-black text-2xl opacity-30">{s.key}</span>
            <span className="font-bold text-sm">{s.label}</span>
          </div>
          <ul className="space-y-1.5">
            {s.items.map((item, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="opacity-50 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

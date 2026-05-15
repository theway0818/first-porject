"use client";

import { useState, useMemo, useEffect } from "react";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  team: string;
  type: "task" | "delivery";
  status: string;
};

const TEAM_COLORS: Record<string, { bg: string; light: string; dot: string }> = {
  구매물류팀: { bg: "bg-amber-700",   light: "bg-amber-100 text-amber-800",   dot: "bg-amber-700" },
  메뉴개발팀: { bg: "bg-emerald-600", light: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600" },
  운영팀:     { bg: "bg-sky-600",     light: "bg-sky-100 text-sky-800",         dot: "bg-sky-600" },
  CS팀:       { bg: "bg-violet-600",  light: "bg-violet-100 text-violet-800",   dot: "bg-violet-600" },
  마케팅팀:   { bg: "bg-rose-500",    light: "bg-rose-100 text-rose-800",       dot: "bg-rose-500" },
  물류팀:     { bg: "bg-orange-500",  light: "bg-orange-100 text-orange-800",   dot: "bg-orange-500" },
};

function getColor(team: string) {
  return TEAM_COLORS[team] ?? { bg: "bg-slate-500", light: "bg-slate-100 text-slate-700", dot: "bg-slate-500" };
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TeamCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<{ events: CalendarEvent[]; x: number; y: number } | null>(null);

  const allTeams = useMemo(() => Array.from(new Set(events.map((e) => e.team))).sort(), [events]);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedTeams(new Set(allTeams));
  }, [allTeams]);

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      next.has(team) ? next.delete(team) : next.add(team);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedTeams(selectedTeams.size === allTeams.length ? new Set() : new Set(allTeams));
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const filteredEvents = events.filter((e) => e.date.startsWith(monthStr) && selectedTeams.has(e.team));

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  filteredEvents.forEach((e) => {
    (eventsByDate[e.date] ??= []).push(e);
  });

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toDateStr(today);

  return (
    <div onClick={() => setTooltip(null)}>
      {/* 팀 필터 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={toggleAll}
          className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {selectedTeams.size === allTeams.length ? "전체 해제" : "전체 선택"}
        </button>
        {allTeams.map((team) => {
          const c = getColor(team);
          const checked = selectedTeams.has(team);
          return (
            <label key={team} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTeam(team)}
                className="sr-only"
              />
              <span className={`w-3 h-3 rounded-sm inline-block ${checked ? c.bg : "bg-gray-200"} transition-colors`} />
              <span className={`text-xs font-medium ${checked ? "text-gray-800" : "text-gray-400"}`}>{team}</span>
            </label>
          );
        })}
      </div>

      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 text-[#6B4226] font-bold transition-colors">‹</button>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#6B4226] text-lg">{year}년 {MONTH_NAMES[month]}</span>
          <button onClick={goToday} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">오늘</button>
        </div>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 text-[#6B4226] font-bold transition-colors">›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 border-l border-t border-gray-100">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="border-r border-b border-gray-100 bg-gray-50 min-h-[80px]" />;
          }
          const dateStr = toDateStr(day);
          const dayEvents = eventsByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const dow = day.getDay();
          const isOtherMonth = false;

          return (
            <div
              key={dateStr}
              className={`border-r border-b border-gray-100 min-h-[80px] p-1 ${isToday ? "bg-amber-50" : "bg-white hover:bg-gray-50"} transition-colors`}
            >
              {/* 날짜 숫자 */}
              <div className="flex justify-end mb-1">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium
                  ${isToday ? "bg-[#6B4226] text-white" : dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-700"}`}>
                  {day.getDate()}
                </span>
              </div>

              {/* 이벤트 목록 */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const c = getColor(e.team);
                  return (
                    <div
                      key={e.id}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setTooltip({ events: dayEvents, x: ev.clientX, y: ev.clientY });
                      }}
                      className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${c.light} hover:opacity-80 transition-opacity`}
                      title={`${e.team} · ${e.title}`}
                    >
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div
                    className="text-xs text-gray-400 px-1 cursor-pointer hover:text-gray-600"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setTooltip({ events: dayEvents, x: ev.clientX, y: ev.clientY });
                    }}
                  >
                    +{dayEvents.length - 3}개 더
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 이벤트 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-xs text-gray-400">이벤트 유형:</span>
        <span className="text-xs text-gray-500">📋 업무 마감일</span>
        <span className="text-xs text-gray-500">🚚 납기 예정일</span>
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-amber-100 p-3 min-w-[200px] max-w-[280px]"
          style={{ top: tooltip.y + 8, left: Math.min(tooltip.x, window.innerWidth - 300) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-sm text-[#6B4226] mb-2">업무 목록 ({tooltip.events.length}건)</div>
          <div className="space-y-1.5">
            {tooltip.events.map((e) => {
              const c = getColor(e.team);
              return (
                <div key={e.id} className="flex items-start gap-2">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <div>
                    <div className="text-xs font-medium text-gray-800">{e.title}</div>
                    <div className="text-xs text-gray-400">{e.team} · {e.type === "task" ? "업무" : "납기"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

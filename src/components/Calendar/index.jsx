import { useMemo } from 'react';

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const todayStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

export default function Calendar({ year, month, items = [], onDateClick, onItemClick }) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({ date: prevMonthLastDay - i, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        date: i,
        isCurrentMonth: true,
        fullDate: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    // Next month padding to fill 42 cells (6 rows * 7 days)
    const paddingNeeded = 42 - calendarDays.length;
    for (let i = 1; i <= paddingNeeded; i++) {
      calendarDays.push({ date: i, isCurrentMonth: false });
    }
    
    return calendarDays;
  }, [year, month]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((dayInfo, index) => {
          const dayItems = dayInfo.isCurrentMonth ? items.filter(item => item.date === dayInfo.fullDate) : [];
          
          return (
            <div
              key={index}
              className={`min-h-[100px] border-b border-r border-slate-100 p-1 flex flex-col transition-colors
                ${dayInfo.isCurrentMonth ? 'bg-transparent hover:bg-slate-50 cursor-pointer' : 'bg-slate-50/60'}
                ${index % 7 === 6 ? 'border-r-0' : ''}
                ${dayInfo.fullDate === todayStr ? 'bg-indigo-50/60' : ''}
              `}
              onClick={() => {
                if (dayInfo.isCurrentMonth && onDateClick) onDateClick(dayInfo.fullDate);
              }}
            >
              <div className="flex justify-end p-1">
                {dayInfo.isCurrentMonth && dayInfo.fullDate === todayStr ? (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-semibold"
                    style={{ background: 'var(--primary)', fontSize: 11 }}
                  >
                    {dayInfo.date}
                  </span>
                ) : (
                  <span className={`text-xs ${dayInfo.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                    {dayInfo.date}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                {dayItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onItemClick) onItemClick(item);
                    }}
                    className="text-[10px] rounded px-1.5 py-0.5 truncate border border-transparent hover:border-white/30"
                    style={{ 
                      backgroundColor: item.color ? `${item.color}30` : 'rgba(255,255,255,0.1)',
                      borderLeft: `2px solid ${item.color || '#fff'}`
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

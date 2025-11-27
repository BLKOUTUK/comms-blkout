
// Let's Go OUT OUT This Christmas - Advent Calendar Widget
// A creative advent calendar with scattered windows of varying sizes on a festive scene
// Inspired by traditional advent calendars where windows are hidden within an illustration

import { useState } from 'react';
import { Calendar, MessageSquare, Gift, Sparkles, Info, Star, Heart, X, ExternalLink } from 'lucide-react';

interface CalendarDay {
  day: number;
  date: string;
  status: 'attended' | 'upcoming' | 'locked';
  time?: string;
  title?: string;
  // Position and size for scattered layout (percentage-based)
  position: { top: string; left: string };
  size: 'sm' | 'md' | 'lg';
}

// Scattered calendar data with positions - windows placed like a real advent calendar
const calendarData: CalendarDay[] = [
  { day: 1, date: 'Sun Dec 1', status: 'attended', title: 'World AIDS Day Weekend', time: '8pm', position: { top: '8%', left: '72%' }, size: 'lg' },
  { day: 2, date: 'Mon Dec 2', status: 'upcoming', time: '6pm', title: 'Memory In The Making Workshop', position: { top: '15%', left: '5%' }, size: 'md' },
  { day: 3, date: 'Tue Dec 3', status: 'upcoming', time: '6:15pm', title: 'Black Men-Talk Health', position: { top: '52%', left: '78%' }, size: 'md' },
  { day: 4, date: 'Wed Dec 4', status: 'locked', position: { top: '35%', left: '42%' }, size: 'sm' },
  { day: 5, date: 'Fri Dec 5', status: 'upcoming', time: '8pm', title: 'Queer Edge Late', position: { top: '68%', left: '15%' }, size: 'lg' },
  { day: 6, date: 'Sat Dec 6', status: 'upcoming', time: '11:30am', title: 'Soft Like Us', position: { top: '5%', left: '35%' }, size: 'md' },
  { day: 7, date: 'Dec 7', status: 'locked', position: { top: '28%', left: '18%' }, size: 'sm' },
  { day: 8, date: 'Dec 8', status: 'locked', position: { top: '45%', left: '62%' }, size: 'md' },
  { day: 9, date: 'Dec 9', status: 'locked', position: { top: '72%', left: '52%' }, size: 'sm' },
  { day: 10, date: 'Dec 10', status: 'locked', position: { top: '18%', left: '55%' }, size: 'sm' },
  { day: 11, date: 'Dec 11', status: 'locked', position: { top: '58%', left: '5%' }, size: 'sm' },
  { day: 12, date: 'Dec 12', status: 'locked', position: { top: '38%', left: '85%' }, size: 'md' },
  { day: 13, date: 'Dec 13', status: 'locked', position: { top: '82%', left: '72%' }, size: 'sm' },
  { day: 14, date: 'Dec 14', status: 'locked', position: { top: '62%', left: '38%' }, size: 'sm' },
  { day: 15, date: 'Dec 15', status: 'locked', position: { top: '25%', left: '72%' }, size: 'sm' },
  { day: 16, date: 'Dec 16', status: 'locked', position: { top: '48%', left: '25%' }, size: 'md' },
  { day: 17, date: 'Dec 17', status: 'locked', position: { top: '8%', left: '88%' }, size: 'sm' },
  { day: 18, date: 'Dec 18', status: 'locked', position: { top: '78%', left: '32%' }, size: 'sm' },
  { day: 19, date: 'Dec 19', status: 'locked', position: { top: '32%', left: '2%' }, size: 'sm' },
  { day: 20, date: 'Dec 20', status: 'locked', position: { top: '88%', left: '8%' }, size: 'md' },
  { day: 21, date: 'Dec 21', status: 'locked', position: { top: '42%', left: '48%' }, size: 'sm' },
  { day: 22, date: 'Dec 22', status: 'locked', position: { top: '75%', left: '88%' }, size: 'sm' },
  { day: 23, date: 'Dec 23', status: 'locked', position: { top: '55%', left: '55%' }, size: 'sm' },
  { day: 24, date: 'Dec 24', status: 'locked', position: { top: '85%', left: '48%' }, size: 'lg' },
];

export function AdventCalendarWidget() {
  const [openDays, setOpenDays] = useState<Set<number>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const toggleDay = (dayData: CalendarDay) => {
    if (dayData.status === 'locked' && !dayData.title) return;

    setOpenDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayData.day)) {
        newSet.delete(dayData.day);
      } else {
        newSet.add(dayData.day);
      }
      return newSet;
    });

    // Show detail modal for days with events
    if (dayData.title) {
      setSelectedDay(dayData);
    }
  };

  const attendedCount = calendarData.filter(d => d.status === 'attended').length;
  const upcomingCount = calendarData.filter(d => d.status === 'upcoming').length;

  return (
    <div className="relative">
      {/* Main container with festive border */}
      <div className="rounded-3xl border-4 border-[#F4A261] bg-white shadow-2xl overflow-hidden">

        {/* Header with Christmas Ident Video */}
        <div className="bg-gradient-to-r from-[#264653] via-[#1D3557] to-[#264653] px-6 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Christmas Ident Video */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-[#F4A261]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/branding/Blkoutchristmas.mp4" type="video/mp4" />
                </video>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Let's Go <span className="text-[#FFB3DA]">OUT OUT</span> This Christmas
                </h2>
                <p className="text-sm text-white/70">Click the windows to discover community events</p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg transition-all ${showInfo ? 'bg-[#F4A261] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Info size={20} />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#FFB3DA]" />
              <span className="text-white"><strong className="text-[#FFB3DA]">{attendedCount}</strong> attended</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#2A9D8F]" />
              <span className="text-white"><strong className="text-[#2A9D8F]">{upcomingCount}</strong> upcoming</span>
            </div>
          </div>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="bg-[#FFFBF5] border-b-2 border-[#F4A261]/30 px-6 py-4">
            <p className="text-[#264653] text-sm leading-relaxed">
              The festive season can feel isolating. <strong>"Let's Go OUT OUT This Christmas"</strong> encourages
              Black queer men to step out, connect, and celebrate together. Click any window to reveal what's happening!
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs items-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gradient-to-br from-[#FFB3DA] to-[#E76F51]"></span> Attended</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gradient-to-br from-[#2A9D8F] to-[#1D6B5F]"></span> Upcoming</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#9CA3AF]"></span> Coming soon</span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <a
                href="https://voices-blkout.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#264653] hover:text-[#F4A261] transition-colors font-medium"
              >
                Read why we're doing this
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Calendar Scene - The illustrated background with scattered windows */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '16/10',
            background: `
              linear-gradient(180deg,
                #1a1a2e 0%,
                #16213e 20%,
                #1a1a2e 40%,
                #0f3460 100%
              )
            `
          }}
        >
          {/* Night sky with stars */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <Star
                key={i}
                size={Math.random() * 8 + 4}
                className="absolute text-white/30"
                style={{
                  top: `${Math.random() * 40}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
                fill="currentColor"
              />
            ))}
          </div>

          {/* Moon */}
          <div
            className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FFF8E7] to-[#F4A261] shadow-[0_0_40px_rgba(244,162,97,0.4)]"
            style={{ top: '5%', left: '15%' }}
          />

          {/* Cityscape silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-[45%]">
            <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,200 L0,120 L30,120 L30,80 L60,80 L60,120 L100,120 L100,60 L130,60 L130,40 L160,40 L160,60 L190,60 L190,100 L250,100 L250,70 L280,70 L280,100 L320,100 L320,50 L350,50 L350,30 L380,30 L380,50 L410,50 L410,90 L450,90 L450,110 L500,110 L500,80 L530,80 L530,60 L560,60 L560,80 L590,80 L590,110 L650,110 L650,70 L680,70 L680,40 L710,40 L710,70 L740,70 L740,100 L800,100 L800,60 L830,60 L830,90 L870,90 L870,120 L920,120 L920,80 L950,80 L950,120 L1000,120 L1000,200 Z"
                fill="#0a0a0f"
              />
              {/* Building windows */}
              {[...Array(40)].map((_, i) => (
                <rect
                  key={i}
                  x={50 + (i % 10) * 95}
                  y={140 + Math.floor(i / 10) * 20}
                  width="6"
                  height="8"
                  fill={Math.random() > 0.3 ? '#F4A261' : '#FFB3DA'}
                  opacity={0.6 + Math.random() * 0.4}
                />
              ))}
            </svg>
          </div>

          {/* Snow on ground */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[8%]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)'
            }}
          />

          {/* Snowflakes animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 md:w-2 md:h-2 bg-white/60 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  animation: `snowfall ${5 + Math.random() * 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          {/* Calendar Windows - Scattered across the scene */}
          {calendarData.map((dayData) => (
            <CalendarWindow
              key={dayData.day}
              data={dayData}
              isOpen={openDays.has(dayData.day)}
              onToggle={() => toggleDay(dayData)}
            />
          ))}
        </div>

        {/* Footer Links */}
        <div className="bg-[#264653] px-6 py-4 flex flex-col sm:flex-row justify-center gap-3">
          <a
            href="https://events-blkout.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A9D8F] text-white font-semibold rounded-lg hover:bg-[#21867A] transition-colors"
          >
            <Calendar size={18} />
            Browse All Events
          </a>
          <a
            href="https://voices-blkout.up.railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E76F51] text-white font-semibold rounded-lg hover:bg-[#D4261A] transition-colors"
          >
            <MessageSquare size={18} />
            Read & Write Reviews
          </a>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-sm text-[#E76F51] font-semibold">Day {selectedDay.day}</span>
                <h3 className="text-xl font-bold text-[#264653]">{selectedDay.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm text-[#264653]/70">
              <span>{selectedDay.date}</span>
              {selectedDay.time && <span className="font-semibold text-[#2A9D8F]">{selectedDay.time}</span>}
            </div>

            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 ${
              selectedDay.status === 'attended'
                ? 'bg-[#FFB3DA]/20 text-[#D4261A]'
                : 'bg-[#2A9D8F]/20 text-[#2A9D8F]'
            }`}>
              {selectedDay.status === 'attended' ? 'You attended!' : 'Upcoming event'}
            </div>

            <div className="flex gap-3">
              <a
                href="https://events-blkout.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#2A9D8F] text-white font-semibold rounded-lg hover:bg-[#21867A] transition-colors"
              >
                <Calendar size={18} />
                View Event
              </a>
              <a
                href="https://voices-blkout.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#E76F51] text-white font-semibold rounded-lg hover:bg-[#D4261A] transition-colors"
              >
                <MessageSquare size={18} />
                {selectedDay.status === 'attended' ? 'Leave Review' : 'Read Reviews'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes snowfall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh)) rotate(360deg); opacity: 0; }
        }
        @keyframes windowGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(244, 162, 97, 0.3); }
          50% { box-shadow: 0 0 20px rgba(244, 162, 97, 0.6); }
        }
      `}</style>
    </div>
  );
}

function CalendarWindow({
  data,
  isOpen,
  onToggle
}: {
  data: CalendarDay;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasEvent = !!data.title;
  const isClickable = data.status !== 'locked' || hasEvent;

  // Size classes based on importance
  const sizeClasses = {
    sm: 'w-10 h-10 md:w-12 md:h-12 text-sm md:text-base',
    md: 'w-12 h-12 md:w-16 md:h-16 text-base md:text-lg',
    lg: 'w-14 h-14 md:w-20 md:h-20 text-lg md:text-xl'
  };

  // Background colors based on status
  const getWindowBg = () => {
    if (!isOpen) {
      // Closed window - wooden/door appearance
      return 'bg-gradient-to-br from-[#8B4513] via-[#A0522D] to-[#654321] border-2 border-[#5D3A1A]';
    }
    // Open window - glowing interior
    switch (data.status) {
      case 'attended':
        return 'bg-gradient-to-br from-[#FFB3DA] to-[#E76F51] border-2 border-[#FF8AC4]';
      case 'upcoming':
        return 'bg-gradient-to-br from-[#2A9D8F] to-[#1D6B5F] border-2 border-[#3DB5A6]';
      default:
        return 'bg-gradient-to-br from-[#F4A261] to-[#E76F51] border-2 border-[#F4A261]';
    }
  };

  return (
    <button
      onClick={onToggle}
      disabled={!isClickable}
      className={`
        absolute rounded-lg shadow-lg transition-all duration-300 transform
        ${sizeClasses[data.size]}
        ${getWindowBg()}
        ${isClickable ? 'cursor-pointer hover:scale-110 hover:z-10' : 'cursor-not-allowed opacity-80'}
        ${isOpen && hasEvent ? 'animate-[windowGlow_2s_ease-in-out_infinite]' : ''}
        flex items-center justify-center
      `}
      style={{
        top: data.position.top,
        left: data.position.left,
      }}
    >
      {!isOpen ? (
        // Closed window - show day number
        <span className="font-bold text-white drop-shadow-md">{data.day}</span>
      ) : (
        // Open window - show icon based on status
        <div className="flex flex-col items-center">
          {data.status === 'attended' ? (
            <Heart size={data.size === 'lg' ? 24 : data.size === 'md' ? 18 : 14} className="text-white" fill="currentColor" />
          ) : data.status === 'upcoming' ? (
            <Sparkles size={data.size === 'lg' ? 24 : data.size === 'md' ? 18 : 14} className="text-white" />
          ) : (
            <Gift size={data.size === 'lg' ? 24 : data.size === 'md' ? 18 : 14} className="text-white" />
          )}
        </div>
      )}
    </button>
  );
}

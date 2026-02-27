/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { KHOREZM_2026_CALENDAR, KHOREZM_DISTRICTS, DUAS } from './constants';
import { AppState, DistrictOffset, CalendarDay, AppTheme } from './types';
import {
  Calendar,
  Clock,
  BookOpen,
  Sun,
  Moon,
  MapPin,
  ChevronRight,
  Info,
  Timer,
  Settings,
  SendHorizontal,
  Calculator,
  CheckSquare,
  Coins,
  Send,
  Plus,
  Trash2,
  X,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppState>(() => {
    const saved = localStorage.getItem('app_started');
    return saved ? AppState.TODAY : AppState.WELCOME;
  });
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOffset>(() => {
    const saved = localStorage.getItem('selected_district');
    return saved ? JSON.parse(saved) : KHOREZM_DISTRICTS[0];
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihText, setTasbihText] = useState('Subhanallah');
  const [tgUser, setTgUser] = useState<any>(null);
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as AppTheme) || AppTheme.EMERALD;
  });

  const themeConfig = useMemo(() => {
    const configs = {
      [AppTheme.EMERALD]: {
        bg: 'bg-[#042f2e]',
        primary: 'emerald-500',
        secondary: 'emerald-400',
        accent: 'emerald-600',
        text: 'emerald-100',
        gradient: 'from-emerald-600 to-emerald-800',
        glow: 'bg-emerald-500/20'
      },
      [AppTheme.ROYAL]: {
        bg: 'bg-[#0a192f]',
        primary: 'amber-500',
        secondary: 'amber-400',
        accent: 'blue-600',
        text: 'amber-100',
        gradient: 'from-blue-900 to-indigo-950',
        glow: 'bg-amber-500/20'
      },
      [AppTheme.SAND]: {
        bg: 'bg-[#2d241e]',
        primary: 'orange-500',
        secondary: 'orange-400',
        accent: 'orange-700',
        text: 'orange-100',
        gradient: 'from-orange-800 to-stone-900',
        glow: 'bg-orange-500/20'
      },
      [AppTheme.MINIMAL]: {
        bg: 'bg-[#0f172a]',
        primary: 'slate-400',
        secondary: 'slate-200',
        accent: 'slate-700',
        text: 'slate-100',
        gradient: 'from-slate-800 to-slate-950',
        glow: 'bg-slate-400/20'
      }
    };
    return configs[theme];
  }, [theme]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Zakat state
  const [zakatAmount, setZakatAmount] = useState<string>('');
  const [zakatResult, setZakatResult] = useState<number | null>(null);

  // Tracker state
  const [trackerData, setTrackerData] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem('ramadan_tracker');
    return saved ? JSON.parse(saved) : {};
  });

  const trackerTasks = [
    'Besh vaqt namoz',
    'Tarovih namozi',
    'Qur\'on tilovati',
    'Zikr va duo',
    'Sadaqa/Ehson'
  ];

  // Personal tasks state
  const [personalTasks, setPersonalTasks] = useState<Record<string, { id: string, text: string, done: boolean }[]>>(() => {
    const saved = localStorage.getItem('personal_tasks');
    return saved ? JSON.parse(saved) : {};
  });
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});

  const addPersonalTask = (day: number) => {
    const dayKey = `day_${day}`;
    const text = newTaskTexts[dayKey] || '';
    if (!text.trim()) return;
    
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      done: false
    };
    setPersonalTasks(prev => {
      const newData = {
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), newTask]
      };
      localStorage.setItem('personal_tasks', JSON.stringify(newData));
      return newData;
    });
    setNewTaskTexts(prev => ({ ...prev, [dayKey]: '' }));
  };

  const togglePersonalTask = (day: number, taskId: string) => {
    const dayKey = `day_${day}`;
    setPersonalTasks(prev => {
      const newData = {
        ...prev,
        [dayKey]: (prev[dayKey] || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      };
      localStorage.setItem('personal_tasks', JSON.stringify(newData));
      return newData;
    });
  };

  const deletePersonalTask = (day: number, taskId: string) => {
    const dayKey = `day_${day}`;
    setPersonalTasks(prev => {
      const newData = {
        ...prev,
        [dayKey]: (prev[dayKey] || []).filter(t => t.id !== taskId)
      };
      localStorage.setItem('personal_tasks', JSON.stringify(newData));
      return newData;
    });
  };

  const toggleTracker = (day: number, taskIdx: number) => {
    setTrackerData(prev => {
      const dayKey = `day_${day}`;
      const currentDayTasks = prev[dayKey] || new Array(trackerTasks.length).fill(false);
      const newDayTasks = [...currentDayTasks];
      newDayTasks[taskIdx] = !newDayTasks[taskIdx];
      
      const newData = { ...prev, [dayKey]: newDayTasks };
      localStorage.setItem('ramadan_tracker', JSON.stringify(newData));
      return newData;
    });
  };

  const tasbihOptions = ['Subhanallah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'];

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect current Ramazon day
  const currentRamazonDay = useMemo(() => {
    const now = currentTime;
    const year = now.getFullYear();
    
    // Find the day in calendar that matches current date
    const foundDay = KHOREZM_2026_CALENDAR.find(day => {
      const [d, mStr] = day.date.split('-');
      const month = mStr === 'Fevral' ? 1 : 2; // 0-indexed: 1 is Feb, 2 is March
      const dayDate = new Date(year, month, parseInt(d));
      return dayDate.toDateString() === now.toDateString();
    });

    return foundDay || KHOREZM_2026_CALENDAR[0]; // Default to Day 1 if not found
  }, [currentTime]);

  const adjustedCalendar = useMemo(() => {
    const adjustTime = (timeStr: string, minutes: number) => {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m + minutes, 0);
      return date.toTimeString().slice(0, 5);
    };

    return KHOREZM_2026_CALENDAR.map(day => ({
      ...day,
      fajr: adjustTime(day.fajr, selectedDistrict.sahar),
      maghrib: adjustTime(day.maghrib, selectedDistrict.iftor)
    }));
  }, [selectedDistrict]);

  const todayData = useMemo(() => {
    const found = adjustedCalendar.find(d => d.day === currentRamazonDay.day);
    return found || adjustedCalendar[0];
  }, [adjustedCalendar, currentRamazonDay]);

  const statusInfo = useMemo(() => {
    const nowStr = currentTime.toTimeString().slice(0, 5);

    if (nowStr < todayData.fajr) {
      return { 
        label: 'Saharlikgacha', 
        targetTime: todayData.fajr, 
        color: 'from-emerald-600 to-emerald-800',
        icon: <Sun className="animate-pulse" />
      };
    } else if (nowStr < todayData.maghrib) {
      return { 
        label: 'Iftorgacha', 
        targetTime: todayData.maghrib, 
        color: 'from-emerald-500 to-teal-600',
        icon: <Moon className="animate-pulse" />
      };
    } else {
      const tomorrowIdx = adjustedCalendar.findIndex(d => d.day === todayData.day) + 1;
      const tomorrow = adjustedCalendar[tomorrowIdx] || todayData;
      return { 
        label: 'Saharlikgacha (Ertaga)', 
        targetTime: tomorrow.fajr, 
        color: 'from-slate-700 to-slate-900',
        icon: <Sun className="opacity-50" />
      };
    }
  }, [currentTime, todayData, adjustedCalendar]);

  const timeLeft = useMemo(() => {
    const [h, m] = statusInfo.targetTime.split(':').map(Number);
    const target = new Date(currentTime);
    
    if (statusInfo.label.includes('Ertaga')) {
      target.setDate(target.getDate() + 1);
    }
    
    target.setHours(h, m, 0);
    
    const diff = target.getTime() - currentTime.getTime();
    if (diff <= 0) return "00:00:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [currentTime, statusInfo]);

  const fastProgress = useMemo(() => {
    if (statusInfo.label !== 'Iftorgacha') return 0;
    
    const [sh, sm] = todayData.fajr.split(':').map(Number);
    const [ih, im] = todayData.maghrib.split(':').map(Number);
    
    const start = new Date(currentTime);
    start.setHours(sh, sm, 0);
    
    const end = new Date(currentTime);
    end.setHours(ih, im, 0);
    
    const total = end.getTime() - start.getTime();
    const elapsed = currentTime.getTime() - start.getTime();
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  }, [currentTime, todayData, statusInfo]);

  const handleShare = () => {
    const text = `🌙 Ramazon 2026 - ${selectedDistrict.name}\n📅 ${todayData.date}\n🌅 Saharlik: ${todayData.fajr}\n🌇 Iftorlik: ${todayData.maghrib}\n\nIlova orqali ko'proq ma'lumot oling!`;
    navigator.clipboard.writeText(text);
    alert('Ma\'lumot nusxalandi!');
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('selected_district', JSON.stringify(selectedDistrict));
  }, [selectedDistrict]);

  const handleStartApp = () => {
    // Add a small delay to simulate "bot starting"
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) btn.disabled = true;
    
    setTimeout(() => {
      localStorage.setItem('app_started', 'true');
      setCurrentTab(AppState.TODAY);
    }, 300);
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppState.WELCOME:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-8 space-y-12"
          >
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`bg-gradient-to-br ${themeConfig.gradient} w-40 h-40 rounded-[3rem] flex items-center justify-center shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative z-10 border border-white/20`}
              >
                <Moon size={80} className="text-white fill-current drop-shadow-2xl" />
              </motion.div>
              <div className={`absolute -inset-8 ${themeConfig.glow} rounded-full blur-[60px] animate-pulse`}></div>
            </div>

            <div className="space-y-4">
              {tgUser && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md"
                >
                  {tgUser.photo_url ? (
                    <img src={tgUser.photo_url} alt="Profile" className={`w-8 h-8 rounded-full border border-${themeConfig.primary}/50`} />
                  ) : (
                    <div className={`w-8 h-8 bg-${themeConfig.primary} rounded-full flex items-center justify-center text-[10px] font-black text-white`}>
                      {tgUser.first_name?.[0]}
                    </div>
                  )}
                  <span className={`text-xs font-bold text-${themeConfig.text}`}>Assalomu alaykum, {tgUser.first_name}!</span>
                </motion.div>
              )}
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Ramazon <span className={`text-${themeConfig.primary}`}>2026</span></h2>
              <p className={`text-${themeConfig.text}/60 font-medium leading-relaxed max-w-xs mx-auto text-sm`}>
                Xorazm viloyati uchun maxsus tayyorlangan ma'naviy yo'lboshchi va taqvim.
              </p>
            </div>

            <div className="w-full space-y-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartApp}
                className={`w-full py-6 bg-gradient-to-r ${themeConfig.gradient} text-white rounded-[2rem] font-black text-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 transition-all border border-white/10`}
              >
                <SendHorizontal size={28} className="rotate-[-45deg]" />
                BOSHLASH
              </motion.button>
              
              <div className={`flex items-center justify-center gap-3 text-${themeConfig.text}/20`}>
                <div className="w-12 h-px bg-current"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Muborak bo'lsin</span>
                <div className="w-12 h-px bg-current"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full pt-4">
              {[
                { icon: <Timer size={24} />, label: 'Taqvim', tab: AppState.MONTH },
                { icon: <CheckSquare size={24} />, label: 'Tracker', tab: AppState.TRACKER },
                { icon: <Calculator size={24} />, label: 'Zakot', tab: AppState.ZAKAT }
              ].map((item, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    localStorage.setItem('app_started', 'true');
                    setCurrentTab(item.tab);
                  }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className={`w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-${themeConfig.text}/40 group-hover:text-${themeConfig.primary} group-hover:border-${themeConfig.primary}/50 group-hover:bg-${themeConfig.primary}/10 transition-all backdrop-blur-md`}>
                    {item.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest text-${themeConfig.text}/30 group-hover:text-${themeConfig.primary}`}>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case AppState.REGION:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <MapPin className={`text-${themeConfig.primary}`} size={20} />
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Hududni tanlang</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {KHOREZM_DISTRICTS.map(district => (
                  <motion.button
                    key={district.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setCurrentTab(AppState.TODAY);
                    }}
                    className={`p-5 rounded-[2rem] border text-left transition-all duration-300 ${
                      selectedDistrict.name === district.name
                        ? `bg-${themeConfig.primary} text-white border-${themeConfig.primary} shadow-xl shadow-black/20`
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-lg">{district.name}</div>
                    <div className={`text-[10px] mt-2 font-medium ${selectedDistrict.name === district.name ? `text-${themeConfig.text}` : `text-${themeConfig.text}/30`}`}>
                      Sahar: {district.sahar >= 0 ? `+${district.sahar}` : district.sahar}m |
                      Iftor: {district.iftor >= 0 ? `+${district.iftor}` : district.iftor}m
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case AppState.TRACKER:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pb-32"
          >
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Amallar Tracker</h2>
              <p className={`text-[10px] text-${themeConfig.primary} font-bold uppercase tracking-[0.4em]`}>Har bir kuningizni samarali o'tkazing</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {KHOREZM_2026_CALENDAR.map((day) => {
                const dayKey = `day_${day.day}`;
                const completedCount = (trackerData[dayKey] || []).filter(Boolean).length;
                const personalDayTasks = personalTasks[dayKey] || [];
                const personalCompletedCount = personalDayTasks.filter(t => t.done).length;
                const totalTasks = trackerTasks.length + personalDayTasks.length;
                const totalCompleted = completedCount + personalCompletedCount;
                const isToday = day.day === currentRamazonDay.day;

                return (
                  <div 
                    key={day.day} 
                    className={`bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border ${isToday ? `border-${themeConfig.primary}/50 bg-${themeConfig.primary}/5` : 'border-white/10'} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${isToday ? `bg-${themeConfig.primary} text-white` : `bg-white/10 text-${themeConfig.text}/40`}`}>
                          {day.day}
                        </div>
                        <div>
                          <h4 className="font-black text-white text-lg tracking-tight">{day.date}</h4>
                          <p className={`text-[10px] text-${themeConfig.primary} font-bold uppercase tracking-widest`}>{totalCompleted} / {totalTasks} bajarildi</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${themeConfig.primary} transition-all duration-500`} 
                          style={{ width: `${totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className={`text-[10px] font-black text-${themeConfig.primary}/40 uppercase tracking-[0.2em] mb-1`}>Asosiy amallar</div>
                      {trackerTasks.map((task, idx) => {
                        const isDone = trackerData[dayKey]?.[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleTracker(day.day, idx)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              isDone 
                                ? `bg-${themeConfig.primary}/20 border-${themeConfig.primary}/30 text-${themeConfig.primary}` 
                                : `bg-white/5 border-white/5 text-${themeConfig.text}/40 hover:bg-white/10`
                            }`}
                          >
                            <span className="text-xs font-bold">{task}</span>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isDone ? `bg-${themeConfig.primary} border-${themeConfig.primary} text-white` : 'border-white/10'
                            }`}>
                              {isDone && <CheckSquare size={14} />}
                            </div>
                          </button>
                        );
                      })}

                      {/* Personal Tasks */}
                      <div className="mt-4 space-y-3">
                        <div className={`text-[10px] font-black text-${themeConfig.primary}/40 uppercase tracking-[0.2em] mb-1`}>Shaxsiy To-Do ro'yxati</div>
                        {personalDayTasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                              task.done 
                                ? `bg-${themeConfig.primary}/10 border-${themeConfig.primary}/20 text-${themeConfig.primary}/60` 
                                : `bg-white/5 border-white/5 text-${themeConfig.text}/60`
                            }`}
                          >
                            <button 
                              onClick={() => togglePersonalTask(day.day, task.id)}
                              className="flex-1 text-left text-xs font-bold truncate"
                            >
                              {task.text}
                            </button>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => togglePersonalTask(day.day, task.id)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  task.done ? `bg-${themeConfig.primary} border-${themeConfig.primary} text-white` : 'border-white/10'
                                }`}
                              >
                                {task.done && <CheckSquare size={14} />}
                              </button>
                              <button 
                                onClick={() => deletePersonalTask(day.day, task.id)}
                                className="w-6 h-6 text-rose-400/40 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 mt-2">
                          <input 
                            type="text"
                            value={newTaskTexts[dayKey] || ''}
                            onChange={(e) => setNewTaskTexts(prev => ({ ...prev, [dayKey]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addPersonalTask(day.day)}
                            placeholder="Yangi amal qo'shish..."
                            className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-${themeConfig.text}/10 outline-none focus:ring-1 focus:ring-${themeConfig.primary} transition-all`}
                          />
                          <button 
                            onClick={() => addPersonalTask(day.day)}
                            className={`bg-${themeConfig.accent} text-white p-3 rounded-xl shadow-lg shadow-black/20 hover:bg-${themeConfig.primary} transition-all`}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      case AppState.ZAKAT:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-10 space-y-12"
          >
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Zakot Hisoblagich</h2>
              <p className={`text-[10px] text-${themeConfig.primary} font-bold uppercase tracking-[0.4em]`}>Molingizdan poklanish va baraka</p>
            </div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
              <div className="space-y-4">
                <label className={`text-[10px] font-black text-${themeConfig.primary} uppercase tracking-[0.3em] px-2`}>Umumiy boyligingiz (so'mda)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={zakatAmount}
                    onChange={(e) => {
                      if (e.target.value.length > 15) return;
                      setZakatAmount(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setZakatResult(val * 0.025);
                      } else {
                        setZakatResult(null);
                      }
                    }}
                    placeholder="Masalan: 100,000,000"
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-white placeholder-${themeConfig.text}/10 outline-none focus:ring-2 focus:ring-${themeConfig.primary} transition-all`}
                  />
                  {zakatAmount && (
                    <button 
                      onClick={() => { setZakatAmount(''); setZakatResult(null); }}
                      className={`absolute right-16 top-1/2 -translate-y-1/2 text-${themeConfig.text}/40 hover:text-${themeConfig.primary} transition-colors`}
                    >
                      <X size={20} />
                    </button>
                  )}
                  <div className={`absolute right-6 top-1/2 -translate-y-1/2 text-${themeConfig.text}/20 font-black`}>UZS</div>
                </div>
              </div>

              {zakatResult !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-8 bg-${themeConfig.primary}/10 rounded-[2rem] border border-${themeConfig.primary}/20 text-center space-y-2 overflow-hidden`}
                >
                  <div className={`text-[10px] font-black text-${themeConfig.primary} uppercase tracking-[0.3em]`}>Sizdan talab qilinadigan zakot</div>
                  <div className={`font-black text-white tracking-tight break-all ${zakatResult.toString().length > 12 ? 'text-xl' : 'text-4xl'}`}>
                    {zakatResult.toLocaleString('uz-UZ')} <span className={`text-lg text-${themeConfig.primary}`}>UZS</span>
                  </div>
                  <p className={`text-[10px] text-${themeConfig.text}/30 font-medium mt-4`}>
                    Zakot miqdori umumiy boylikning 2.5% (1/40) qismini tashkil etadi.
                  </p>
                </motion.div>
              )}

              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-start">
                <Info size={20} className={`text-${themeConfig.primary} shrink-0 mt-1`} />
                <p className={`text-[10px] text-${themeConfig.text}/40 leading-relaxed font-medium`}>
                  Zakot berish uchun boyligingiz Nisob miqdoridan oshgan va bir yil davomida sizda saqlangan bo'lishi kerak.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 text-center">
                <Coins size={24} className={`text-${themeConfig.primary} mx-auto mb-3`} />
                <div className={`text-[10px] font-black text-${themeConfig.text}/40 uppercase tracking-widest`}>Nisob (Gold)</div>
                <div className="text-white font-black text-lg">85 gr. oltin</div>
              </div>
              <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 text-center">
                <Calculator size={24} className={`text-${themeConfig.primary} mx-auto mb-3`} />
                <div className={`text-[10px] font-black text-${themeConfig.text}/40 uppercase tracking-widest`}>Nisbat</div>
                <div className="text-white font-black text-lg">2.5%</div>
              </div>
            </div>
          </motion.div>
        );

      case AppState.TODAY:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Main Card */}
            <div className={`bg-gradient-to-br ${statusInfo.color} p-8 rounded-[3rem] text-white shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative overflow-hidden border border-white/10`}>
              {/* Decorative elements */}
              <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/20 rounded-full blur-[80px]"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start gap-6 mb-12">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md border border-white/10">
                        <MapPin size={14} className={`text-${themeConfig.secondary}`} />
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.3em] text-${themeConfig.text}/60`}>{selectedDistrict.name}</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter leading-none text-white">{todayData.date}</h2>
                    <p className={`text-${themeConfig.text}/60 text-sm font-bold mt-3 tracking-wide`}>Ramazonning {todayData.day}-kuni • 1447 h.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white/5 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
                      <div className="text-center">
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] text-${themeConfig.text}/40 mb-1.5`}>Hozir</div>
                        <div className="text-2xl font-black tabular-nums tracking-tight text-white">{currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="bg-white/5 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 text-white flex items-center justify-center shadow-xl"
                    >
                      <Send size={20} className="rotate-[-45deg]" />
                    </motion.button>
                  </div>
                </div>

                {/* Countdown */}
                <div className="mb-12 text-center py-12 bg-black/20 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-inner">
                  <div className={`flex items-center justify-center gap-3 mb-4 text-${themeConfig.secondary}/80`}>
                    <div className="scale-125">{statusInfo.icon}</div>
                    <span className="text-sm font-black uppercase tracking-[0.4em]">{statusInfo.label}</span>
                  </div>
                  <div className="text-7xl font-black tracking-tighter tabular-nums drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6 text-white">
                    {timeLeft}
                  </div>
                  
                  {/* Progress Bar */}
                  {statusInfo.label === 'Iftorgacha' && (
                    <div className="px-12">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${fastProgress}%` }}
                          className={`h-full bg-gradient-to-r from-${themeConfig.primary} to-${themeConfig.secondary} shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                        />
                      </div>
                      <div className={`flex justify-between mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-${themeConfig.text}/40`}>
                        <span>Saharlik</span>
                        <span className={`text-${themeConfig.primary}`}>{Math.round(fastProgress)}%</span>
                        <span>Iftorlik</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group hover:bg-white/10 transition-all cursor-default">
                    <div className={`flex items-center gap-3 mb-4 text-${themeConfig.secondary}/60`}>
                      <Sun size={22} />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Saharlik</span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter tabular-nums text-white">{todayData.fajr}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group hover:bg-white/10 transition-all cursor-default">
                    <div className={`flex items-center gap-3 mb-4 text-${themeConfig.secondary}/60`}>
                      <Moon size={22} />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Iftorlik</span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter tabular-nums text-white">{todayData.maghrib}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/10 flex items-center justify-between group cursor-pointer" 
                onClick={() => setCurrentTab(AppState.DUA)}
              >
                <div className="flex items-center gap-6">
                  <div className={`bg-${themeConfig.primary}/10 p-5 rounded-2xl text-${themeConfig.primary} shadow-inner group-hover:bg-${themeConfig.primary} group-hover:text-white transition-all duration-500 border border-${themeConfig.primary}/20`}>
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xl tracking-tight">Kundalik duolar</h3>
                    <p className={`text-[11px] text-${themeConfig.text}/30 font-black uppercase tracking-[0.2em] mt-1`}>Sahar va Iftorlik</p>
                  </div>
                </div>
                <div className={`bg-white/5 p-3 rounded-full text-${themeConfig.text}/20 group-hover:text-${themeConfig.primary} group-hover:bg-${themeConfig.primary}/10 transition-all`}>
                  <ChevronRight size={24} />
                </div>
              </motion.div>

              <div className="bg-black/20 backdrop-blur-md p-8 rounded-[3rem] border border-white/5 flex gap-5 items-center">
                <div className={`bg-white/5 p-3 rounded-xl text-${themeConfig.primary} shadow-sm border border-white/5`}>
                  <Info size={22} />
                </div>
                <p className={`text-[11px] text-${themeConfig.text}/40 leading-relaxed font-bold uppercase tracking-wider`}>
                  Vaqtlar O'zbekiston Musulmonlari idorasi taqvimi asosida.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case AppState.MONTH:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
              <div className={`bg-gradient-to-br ${themeConfig.gradient} p-8 text-white relative overflow-hidden`}>
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">Ramazon taqvimi</h2>
                    <p className={`text-${themeConfig.text}/60 text-xs font-bold uppercase tracking-widest`}>{selectedDistrict.name} vaqti bilan</p>
                  </div>
                  <div className="text-xs font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    2026 / 1447 H.
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto bg-transparent">
                <table className="w-full text-left border-collapse">
                  <thead className={`sticky top-0 bg-black/40 backdrop-blur-md shadow-sm z-10 border-b border-white/5`}>
                    <tr className={`text-${themeConfig.text}/30 text-[11px] font-black uppercase tracking-widest`}>
                      <th className="pl-8 pr-2 py-5">Kun</th>
                      <th className="px-2 py-5">Sana</th>
                      <th className="px-2 py-5 text-center">Sahar</th>
                      <th className="pl-2 pr-8 py-5 text-center">Iftor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adjustedCalendar.map((day, idx) => {
                      const isToday = day.day === currentRamazonDay.day;
                      return (
                        <tr 
                          key={idx} 
                          className={`group transition-all duration-150 ${isToday ? `bg-${themeConfig.primary}/10` : 'hover:bg-white/5'}`}
                        >
                          <td className={`pl-8 pr-2 py-4 font-black text-sm ${isToday ? `text-${themeConfig.primary}` : `text-${themeConfig.text}/20`}`}>
                            {String(day.day).padStart(2, '0')}
                          </td>
                          <td className={`px-2 py-4 font-bold text-sm ${isToday ? 'text-white' : `text-${themeConfig.text}/40`}`}>
                            {day.date}
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-sm tabular-nums ${isToday ? `bg-${themeConfig.primary}/20 text-${themeConfig.primary} border border-${themeConfig.primary}/30` : `text-${themeConfig.text}/60`}`}>
                              {day.fajr}
                            </span>
                          </td>
                          <td className="pl-2 pr-8 py-4 text-center">
                            <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-sm tabular-nums ${isToday ? `bg-${themeConfig.primary} text-white shadow-lg shadow-black/20` : `text-${themeConfig.primary}`}`}>
                              {day.maghrib}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );

      case AppState.DUA:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pb-32"
          >
            {[DUAS.sahar, DUAS.iftar].map((dua, i) => (
              <div key={i} className="relative">
                {/* Decorative background number */}
                <div className="absolute -top-10 -left-4 text-[12rem] font-black text-white/5 select-none -z-0 leading-none opacity-50">
                  0{i + 1}
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl border border-white/10 relative overflow-hidden group z-10">
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-${themeConfig.primary}/5 rounded-bl-[8rem] -z-0 opacity-40 group-hover:scale-110 transition-transform duration-1000`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className={`w-12 h-12 bg-gradient-to-br ${themeConfig.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/20`}>
                        {i === 0 ? <Sun size={24} /> : <Moon size={24} />}
                      </div>
                      <h3 className="font-black text-white text-2xl tracking-tight leading-tight uppercase">{dua.title}</h3>
                    </div>

                    <div className="space-y-10">
                      <div className="relative text-right">
                        <p className={`text-3xl text-${themeConfig.secondary} font-arabic leading-relaxed arabic-font`}>
                          {dua.arabic}
                        </p>
                      </div>

                      <div className="relative">
                        <div className={`absolute -left-6 top-0 bottom-0 w-1 bg-${themeConfig.primary} rounded-full opacity-30`}></div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-${themeConfig.primary} mb-4 px-2`}>O'qilishi</div>
                        <p className="text-2xl text-white font-bold italic leading-relaxed px-2 tracking-tight">
                          "{dua.transliteration}"
                        </p>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-${themeConfig.text}/20 mb-4`}>Ma'nosi</div>
                        <p className={`text-sm text-${themeConfig.text}/60 font-medium leading-relaxed`}>
                          {dua.translation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-black/20 backdrop-blur-xl p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex items-start gap-5">
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Info size={24} className={`text-${themeConfig.primary}`} />
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 uppercase tracking-tight">Eslatma</h4>
                  <p className={`text-xs text-${themeConfig.text}/40 leading-relaxed font-medium`}>
                    Duolarni chin dildan, ixlos bilan o'qish ijobat bo'lishining asosiy shartlaridan biridir. Alloh tutgan ro'zalaringizni qabul qilsin.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case AppState.TASBIH:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-10 space-y-12"
          >
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Raqamli Tasbeh</h2>
              <p className={`text-[10px] text-${themeConfig.primary} font-bold uppercase tracking-[0.4em]`}>Zikr qiling va savobingizni ko'paytiring</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 px-4">
              {tasbihOptions.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setTasbihText(opt)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md border ${
                    tasbihText === opt ? `bg-${themeConfig.primary} text-white border-${themeConfig.primary} shadow-lg shadow-black/20` : `bg-white/5 text-${themeConfig.text}/40 border-white/10 hover:bg-white/10`
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className={`absolute inset-0 ${themeConfig.glow} rounded-full blur-[80px] animate-pulse`}></div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTasbihCount(prev => prev + 1)}
                className="relative w-72 h-72 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl rounded-full shadow-[0_40px_80_rgba(0,0,0,0.5)] border-8 border-white/5 flex flex-col items-center justify-center group"
              >
                <div className="text-8xl font-black text-white tabular-nums mb-2 drop-shadow-2xl">{tasbihCount}</div>
                <div className={`text-[10px] font-black text-${themeConfig.primary}/40 uppercase tracking-[0.4em] group-hover:text-${themeConfig.primary} transition-colors`}>Bosing</div>
              </motion.button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setTasbihCount(0)}
                className={`flex items-center gap-3 px-8 py-4 bg-white/5 text-${themeConfig.text}/40 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md`}
              >
                <Settings size={16} />
                Qayta boshlash
              </button>
            </div>

            <div className={`p-10 bg-black/20 backdrop-blur-xl rounded-[3rem] w-full text-center border border-white/5`}>
              <div className="text-white font-black text-2xl mb-2 tracking-tight uppercase">"{tasbihText}"</div>
              <p className={`text-[10px] text-${themeConfig.primary} font-bold uppercase tracking-[0.4em] opacity-60`}>Faol zikr</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 ${themeConfig.bg} flex flex-col font-sans selection:bg-white/10 selection:text-white overflow-hidden transition-colors duration-700`}>
      {/* Immersive Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] ${themeConfig.glow} rounded-full blur-[120px]`}></div>
        <div className={`absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] ${themeConfig.glow} rounded-full blur-[100px] opacity-50`}></div>
        <div className={`absolute top-[40%] left-[30%] w-[40%] h-[40%] ${themeConfig.glow} rounded-full blur-[140px] opacity-30`}></div>
      </div>

      {/* Header */}
      {currentTab !== AppState.WELCOME && (
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-3 max-w-xl mx-auto w-full">
            <div className="flex items-center gap-3 flex-1">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.05 }}
                className={`bg-gradient-to-br ${themeConfig.gradient} w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border border-white/10`}
              >
                <Moon size={20} className="text-white fill-current" />
              </motion.div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">RAMAZON <span className={`text-${themeConfig.primary}`}>2026</span></h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 bg-${themeConfig.primary} rounded-full animate-pulse`}></div>
                  <span className={`text-[8px] text-${themeConfig.text}/60 font-black uppercase tracking-[0.2em]`}>Xorazm viloyati</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 backdrop-blur-md">
                {[AppTheme.EMERALD, AppTheme.ROYAL, AppTheme.SAND, AppTheme.MINIMAL].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`w-6 h-6 rounded-lg transition-all ${theme === t ? 'scale-110 ring-2 ring-white/20' : 'opacity-30 hover:opacity-100'}`}
                    style={{ 
                      backgroundColor: 
                        t === AppTheme.EMERALD ? '#10b981' : 
                        t === AppTheme.ROYAL ? '#f59e0b' : 
                        t === AppTheme.SAND ? '#f97316' : '#94a3b8' 
                    }}
                  />
                ))}
              </div>

              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentTab(AppState.REGION)}
                className={`flex items-center gap-2 text-[10px] font-black text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md transition-all shadow-sm`}
              >
                <MapPin size={12} className={`text-${themeConfig.primary}`} />
                {selectedDistrict.name.toUpperCase()}
              </motion.button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar">
        <div className="max-w-xl mx-auto w-full p-4 pb-36">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      {currentTab !== AppState.WELCOME && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-50`}>
          <nav className="max-w-lg mx-auto bg-black/40 backdrop-blur-2xl border border-white/10 p-1.5 flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] pointer-events-auto">
            <NavButton active={currentTab === AppState.TODAY} onClick={() => setCurrentTab(AppState.TODAY)} icon={<Timer size={18} />} label="Bugun" themeConfig={themeConfig} />
            <NavButton active={currentTab === AppState.MONTH} onClick={() => setCurrentTab(AppState.MONTH)} icon={<Calendar size={18} />} label="Taqvim" themeConfig={themeConfig} />
            <NavButton active={currentTab === AppState.TRACKER} onClick={() => setCurrentTab(AppState.TRACKER)} icon={<CheckSquare size={18} />} label="Tracker" themeConfig={themeConfig} />
            <NavButton active={currentTab === AppState.ZAKAT} onClick={() => setCurrentTab(AppState.ZAKAT)} icon={<Calculator size={18} />} label="Zakot" themeConfig={themeConfig} />
            <NavButton active={currentTab === AppState.TASBIH} onClick={() => setCurrentTab(AppState.TASBIH)} icon={<Settings size={18} />} label="Tasbeh" themeConfig={themeConfig} />
            <NavButton active={currentTab === AppState.DUA} onClick={() => setCurrentTab(AppState.DUA)} icon={<BookOpen size={18} />} label="Duolar" themeConfig={themeConfig} />
          </nav>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; themeConfig: any }> = ({ active, onClick, icon, label, themeConfig }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-300 rounded-2xl ${active ? `text-${themeConfig.primary} bg-white/10 shadow-inner` : `text-${themeConfig.text}/40 hover:text-${themeConfig.text}`}`}
  >
    <motion.div animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}>
      {icon}
    </motion.div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;

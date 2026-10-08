import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  DollarSign, 
  Clock, 
  Plus, 
  Trash2, 
  Calculator, 
  RotateCcw, 
  Sun, 
  Moon, 
  Printer, 
  Copy, 
  Check, 
  Calendar
} from 'lucide-react';
import './index.css';

const DAYS_DATA = [
  { id: 'mon', name: 'Monday', isWeekend: false },
  { id: 'tue', name: 'Tuesday', isWeekend: false },
  { id: 'wed', name: 'Wednesday', isWeekend: false },
  { id: 'thu', name: 'Thursday', isWeekend: false },
  { id: 'fri', name: 'Friday', isWeekend: false },
  { id: 'sat', name: 'Saturday', isWeekend: true },
  { id: 'sun', name: 'Sunday', isWeekend: true }
];

export default function App() {
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('workpay_theme') || 'light';
  });

  // Hourly Rate State
  const [hourlyRate, setHourlyRate] = useState('25');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Has calculated once trigger
  const [hasCalculated, setHasCalculated] = useState(false);

  // Schedule Days state - Each day has an array of slots
  const [schedule, setSchedule] = useState(() => {
    return DAYS_DATA.map((day) => ({
      ...day,
      slots: [{ id: Date.now() + '-' + day.id + '-1', duration: '', unit: 'hours' }]
    }));
  });

  // Sync theme attribute with body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('workpay_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Add a slot to a day
  const handleAddSlot = (dayId) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            slots: [
              ...day.slots,
              { id: Date.now() + '-' + Math.random(), duration: '', unit: 'hours' }
            ]
          };
        }
        return day;
      })
    );
  };

  // Remove a slot from a day
  const handleRemoveSlot = (dayId, slotId) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          if (day.slots.length <= 1) {
            return {
              ...day,
              slots: [{ id: Date.now() + '-1', duration: '', unit: 'hours' }]
            };
          }
          return {
            ...day,
            slots: day.slots.filter((s) => s.id !== slotId)
          };
        }
        return day;
      })
    );
  };

  // Update a slot duration or unit
  const handleUpdateSlot = (dayId, slotId, field, value) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            slots: day.slots.map((slot) => {
              if (slot.id === slotId) {
                return { ...slot, [field]: value };
              }
              return slot;
            })
          };
        }
        return day;
      })
    );
  };

  // Clear all time slots
  const clearAll = () => {
    setSchedule(
      DAYS_DATA.map((day) => ({
        ...day,
        slots: [{ id: Date.now() + '-' + day.id + '-1', duration: '', unit: 'hours' }]
      }))
    );
    setHasCalculated(false);
    showToast('Cleared schedule');
  };

  // Memoized Calculations
  const calculations = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    let grandTotalMinutes = 0;

    const daySummaries = schedule.map((day) => {
      let dayMinutes = 0;
      day.slots.forEach((slot) => {
        const val = parseFloat(slot.duration) || 0;
        if (slot.unit === 'hours') {
          dayMinutes += Math.round(val * 60);
        } else {
          dayMinutes += Math.round(val);
        }
      });

      grandTotalMinutes += dayMinutes;
      const dayHoursDecimal = dayMinutes / 60;
      const dayEarnings = dayHoursDecimal * rate;

      return {
        ...day,
        dayMinutes,
        dayHoursDecimal,
        dayEarnings
      };
    });

    const totalHoursDecimal = grandTotalMinutes / 60;
    const hoursPart = Math.floor(grandTotalMinutes / 60);
    const minutesPart = grandTotalMinutes % 60;

    const totalEarnings = totalHoursDecimal * rate;
    const activeDaysCount = daySummaries.filter((d) => d.dayMinutes > 0).length || 1;
    const dailyAverage = totalEarnings / activeDaysCount;

    return {
      rate,
      grandTotalMinutes,
      totalHoursDecimal,
      hoursPart,
      minutesPart,
      totalEarnings,
      activeDaysCount,
      dailyAverage,
      daySummaries
    };
  }, [schedule, hourlyRate]);

  // Compute Current Week Date Range for header & PDF Filename
  const weekRangeInfo = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const mon = new Date(now);
    mon.setDate(now.getDate() + distToMon);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const monMonthName = mon.toLocaleDateString('en-US', { month: 'long' });
    const monMonthShort = mon.toLocaleDateString('en-US', { month: 'short' });
    const sunMonthShort = sun.toLocaleDateString('en-US', { month: 'short' });

    const monDay = mon.getDate();
    const sunDay = sun.getDate();
    const year = sun.getFullYear();

    let displayRange = `${monMonthShort} ${monDay} – ${sunMonthShort} ${sunDay}, ${year}`;
    let filename = `${monDay}to${sunDay}${monMonthName}`;

    return {
      displayRange,
      filename
    };
  }, []);

  // Handle calculation action
  const handleCalculateClick = () => {
    setHasCalculated(true);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#9CA3AF']
    });

    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Copy Summary text
  const handleCopySummary = () => {
    const summaryText = `
Weekly Work Hours & Pay Summary (${weekRangeInfo.displayRange})
----------------------------------
Hourly Rate: $${calculations.rate.toFixed(2)}/hr
Total Time Worked: ${calculations.hoursPart}h ${calculations.minutesPart}m (${calculations.totalHoursDecimal.toFixed(2)} total hrs)
Total Earnings: $${calculations.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Daily Breakdown:
${calculations.daySummaries
  .filter((d) => d.dayMinutes > 0)
  .map(
    (d) =>
      `• ${d.name}: ${(d.dayMinutes / 60).toFixed(2)} hrs ($${d.dayEarnings.toFixed(2)})`
  )
  .join('\n')}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    showToast('Summary copied');
    setTimeout(() => setCopied(false), 2500);
  };

  // Print with custom dynamic filename (e.g. 5to11October.pdf)
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = weekRangeInfo.filename;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      {/* Interactive Web Container */}
      <div className="app-container">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="toast-container">
            <div className="toast">
              <Check size={16} color="var(--accent-emerald)" />
              {toastMessage}
            </div>
          </div>
        )}

        {/* Header Bar */}
        <header className="app-header">
          <div className="brand">
            <div className="brand-icon">
              <Clock size={20} />
            </div>
            <div>
              <h1 className="brand-title">Weekly hours & earnings calculator</h1>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Hourly Rate Card */}
        <section className="rate-banner-card">
          <div className="rate-input-group">
            <label className="input-label" htmlFor="hourly-rate-input">
              Hourly Pay Rate
            </label>
            <div className="rate-field-wrapper">
              <span className="currency-prefix">$</span>
              <input
                id="hourly-rate-input"
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="rate-input"
              />
              <span className="rate-input-suffix">/ hr</span>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="presets-toolbar">
          <h2 className="section-title">
            <Calendar size={18} color="var(--text-secondary)" />
            Weekly Schedule
          </h2>

          <div className="template-btn-group">
            <button className="btn-danger-ghost" onClick={clearAll}>
              <RotateCcw size={14} />
              Clear
            </button>
          </div>
        </section>

        {/* Days Grid */}
        <section className="days-grid">
          {schedule.map((day) => {
            let dayMins = 0;
            day.slots.forEach((s) => {
              const v = parseFloat(s.duration) || 0;
              dayMins += s.unit === 'hours' ? Math.round(v * 60) : Math.round(v);
            });
            const dayHrs = (dayMins / 60).toFixed(1);

            return (
              <div
                key={day.id}
                className={`day-card ${dayMins > 0 ? 'has-data' : ''}`}
              >
                <div className="day-header">
                  <div className="day-info">
                    <span className="day-name">{day.name}</span>
                    {day.isWeekend && <span className="day-subtext">Weekend</span>}
                  </div>
                  {dayMins > 0 && (
                    <span className="day-total-badge">
                      {dayHrs} {parseFloat(dayHrs) === 1 ? 'hr' : 'hrs'}
                    </span>
                  )}
                </div>

                <div className="slots-container">
                  {day.slots.map((slot, index) => (
                    <div key={slot.id} className="slot-row">
                      <span className="slot-label">
                        {day.slots.length > 1 ? `Shift ${index + 1}` : 'Hours'}
                      </span>

                      <div className="slot-input-wrapper">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={slot.duration}
                          onChange={(e) => handleUpdateSlot(day.id, slot.id, 'duration', e.target.value)}
                          className="slot-input"
                        />
                      </div>

                      {/* Segmented Unit Toggle */}
                      <div className="unit-toggle">
                        <button
                          type="button"
                          className={`unit-btn ${slot.unit === 'hours' ? 'active' : ''}`}
                          onClick={() => handleUpdateSlot(day.id, slot.id, 'unit', 'hours')}
                        >
                          hr
                        </button>
                        <button
                          type="button"
                          className={`unit-btn ${slot.unit === 'minutes' ? 'active' : ''}`}
                          onClick={() => handleUpdateSlot(day.id, slot.id, 'unit', 'minutes')}
                        >
                          min
                        </button>
                      </div>

                      {day.slots.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-slot"
                          onClick={() => handleRemoveSlot(day.id, slot.id)}
                          title="Remove slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-add-slot"
                  onClick={() => handleAddSlot(day.id)}
                >
                  <Plus size={13} /> Add Shift
                </button>
              </div>
            );
          })}
        </section>

        {/* Calculate Button */}
        <div className="action-calc-wrapper">
          <button className="btn-calculate" onClick={handleCalculateClick}>
            <Calculator size={18} />
            Calculate Total Pay
          </button>
        </div>

        {/* Calculated Results Section */}
        {(hasCalculated || calculations.grandTotalMinutes > 0) && (
          <section id="results-section" className="results-panel">
            <div className="results-header">
              <div className="results-title-group">
                <h2 className="results-title">Weekly Pay Breakdown</h2>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Rate: ${calculations.rate.toFixed(2)}/hr
              </div>
            </div>

            <div className="pay-summary-hero">
              {/* Total Pay Box */}
              <div className="stat-box highlight">
                <span className="stat-label">Total Earnings</span>
                <span className="stat-value">
                  ${calculations.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="stat-subtext">Gross weekly estimate</span>
              </div>

              {/* Total Hours Box */}
              <div className="stat-box">
                <span className="stat-label">Total Worked</span>
                <span className="stat-value">
                  {calculations.hoursPart}h {calculations.minutesPart}m
                </span>
                <span className="stat-subtext">
                  Total time logged
                </span>
              </div>

              {/* Daily Average Box */}
              <div className="stat-box">
                <span className="stat-label">Daily Average</span>
                <span className="stat-value">
                  ${calculations.dailyAverage.toFixed(2)}
                </span>
                <span className="stat-subtext">
                  Across {calculations.activeDaysCount} active days
                </span>
              </div>
            </div>

            {/* Daily Distribution Bars */}
            <div className="breakdown-section">
              <h3 className="breakdown-title">Summary</h3>
              <div className="breakdown-bars">
                {calculations.daySummaries.map((d) => {
                  const maxHours = Math.max(...calculations.daySummaries.map((day) => day.dayHoursDecimal), 1);
                  const percent = (d.dayHoursDecimal / maxHours) * 100;

                  return (
                    <div key={d.id} className="breakdown-item">
                      <span className="breakdown-day-name">{d.name}</span>
                      <div className="breakdown-bar-track">
                        <div
                          className="breakdown-bar-fill"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="breakdown-pay">
                        {d.dayMinutes > 0 ? (
                          <>{d.dayHoursDecimal.toFixed(1)}h • ${d.dayEarnings.toFixed(2)}</>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="results-actions">
              <button className="btn-secondary" onClick={handleCopySummary}>
                {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy Summary'}
              </button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={15} />
                Print Report
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Dedicated Clean 1-Page Print Template (Strictly ONLY this area prints) */}
      <div className="print-document">
        <div className="print-header">
          <div>
            <div className="print-subtitle">Period: {weekRangeInfo.displayRange}</div>
          </div>
          <div className="print-meta">
            <div><strong>Date Issued:</strong> {currentDateStr}</div>
            <div><strong>Hourly Rate:</strong> ${calculations.rate.toFixed(2)} / hr</div>
          </div>
        </div>

        <div className="print-summary-hero">
          <div className="print-stat-card">
            <span className="print-stat-label">Total Work Hours</span>
            <span className="print-stat-value">{calculations.hoursPart}h {calculations.minutesPart}m</span>
          </div>

          <div className="print-stat-card highlight">
            <span className="print-stat-label">Total Amount Due</span>
            <span className="print-stat-value">${calculations.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="print-stat-sub">Gross weekly total</span>
          </div>
        </div>

        <div className="print-section-title">Summary</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time Logged</th>
              <th className="text-right">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {calculations.daySummaries.map((day) => (
              <tr key={day.id} className={day.dayMinutes === 0 ? 'print-off-row' : ''}>
                <td className="font-semibold">{day.name}</td>
                <td>
                  {day.dayMinutes > 0 ? (
                    `${Math.floor(day.dayMinutes / 60)}h ${day.dayMinutes % 60}m`
                  ) : (
                    '—'
                  )}
                </td>
                <td className="text-right font-semibold">
                  {day.dayMinutes > 0 ? `$${day.dayEarnings.toFixed(2)}` : '$0.00'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-bold">Weekly Total</td>
              <td className="font-bold">{calculations.hoursPart}h {calculations.minutesPart}m</td>
              <td className="text-right font-bold text-lg">${calculations.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

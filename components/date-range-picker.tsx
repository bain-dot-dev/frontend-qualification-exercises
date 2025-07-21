"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  value?: string;
  placeholder?: string;
  onDateChange?: (startDate: Date | null, endDate: Date | null) => void;
  onDateRangeChange?: (
    from: string | undefined,
    to: string | undefined
  ) => void;
}

type DateRange = {
  start: Date | null;
  end: Date | null;
};

export function DateRangePicker({
  placeholder,
  onDateChange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string>("This week");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempRange, setTempRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  const presetOptions = [
    "Today",
    "Yesterday",
    "This week",
    "Last week",
    "This month",
    "Last month",
    "This year",
    "Last year",
    "All time",
  ];

  const getPresetDates = (preset: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "Today":
        return { start: today, end: today };
      case "Yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      case "This week":
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Sunday
        return { start: thisWeekStart, end: thisWeekEnd };
      case "Last week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6); // Last Monday
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last Sunday
        return { start: lastWeekStart, end: lastWeekEnd };
      case "This month":
        const thisMonthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const thisMonthEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        return { start: thisMonthStart, end: thisMonthEnd };
      case "Last month":
        const lastMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      case "This year":
        const thisYearStart = new Date(today.getFullYear(), 0, 1);
        const thisYearEnd = new Date(today.getFullYear(), 11, 31);
        return { start: thisYearStart, end: thisYearEnd };
      case "Last year":
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        return { start: lastYearStart, end: lastYearEnd };
      case "All time":
        return { start: null, end: null };
      default:
        return { start: null, end: null };
    }
  };

  const handlePresetClick = (preset: string) => {
    setSelectedRange(preset);
    const range = getPresetDates(preset);
    setTempRange(range);
    if (range.start) {
      setCurrentMonth(new Date(range.start));
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "00:00:00";
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Helper function to convert Date to ISO string for GraphQL
  const formatDateForGraphQL = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];

    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
  };

  const handleDateClick = (date: Date) => {
    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      // Start new selection
      setTempRange({ start: date, end: null });
      setSelectedRange("Custom");
    } else {
      // Complete selection
      if (date < tempRange.start) {
        setTempRange({ start: date, end: tempRange.start });
      } else {
        setTempRange({ start: tempRange.start, end: date });
      }
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  };

  const handleApply = () => {
    setDateRange(tempRange);
    setOpen(false);

    // Call both callback types for backward compatibility
    if (onDateChange) {
      onDateChange(tempRange.start, tempRange.end);
    }

    if (onDateRangeChange) {
      onDateRangeChange(
        formatDateForGraphQL(tempRange.start),
        formatDateForGraphQL(tempRange.end)
      );
    }
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedRange = { start: null, end: null };
    setTempRange(clearedRange);
    setDateRange(clearedRange);
    setSelectedRange("All time");
    setOpen(false);

    // Call both callback types for clearing
    if (onDateChange) {
      onDateChange(null, null);
    }

    if (onDateRangeChange) {
      onDateRangeChange(undefined, undefined);
    }
  };

  const renderCalendar = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthName = monthDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <ChevronLeft
            className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white"
            onClick={() => navigateMonth("prev")}
          />
          <h3 className="text-white font-medium">{monthName}</h3>
          <ChevronRight
            className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white"
            onClick={() => navigateMonth("next")}
          />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div key={day} className="text-gray-400 py-2">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const isStart = isSameDay(day.date, tempRange.start);
            const isEnd = isSameDay(day.date, tempRange.end);
            const inRange = isInRange(day.date, tempRange.start, tempRange.end);

            return (
              <div
                key={index}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                className={`py-2 cursor-pointer rounded ${
                  day.isCurrentMonth
                    ? `text-white hover:bg-gray-700 ${
                        isStart || isEnd
                          ? "bg-[#F2BF4E] text-black font-medium"
                          : inRange
                          ? "bg-[#98712B] text-black"
                          : ""
                      }`
                    : "text-gray-500"
                }`}
              >
                {day.date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getDisplayText = () => {
    if (selectedRange === "Custom" && (tempRange.start || tempRange.end)) {
      if (tempRange.start && tempRange.end) {
        return `${formatDate(tempRange.start)} - ${formatDate(tempRange.end)}`;
      } else if (tempRange.start) {
        return `${formatDate(tempRange.start)} - Select end date`;
      }
    }

    if (dateRange.start && dateRange.end) {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    }

    return selectedRange !== "Custom" ? selectedRange : placeholder;
  };

  const hasSelectedRange =
    dateRange.start || dateRange.end || selectedRange !== "All time";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-auto justify-between bg-[#0A1117] border-gray-600 hover:bg-gray-700 font-medium text-[14px] leading-[20px] ${
            hasSelectedRange ? "text-[#7A7A7A]" : "text-white"
          }`}
        >
          {hasSelectedRange ? getDisplayText() : placeholder}{" "}
          {/* {placeholder} */}
          <ChevronDown className="size-5 text-[#C2C2C2]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[800px] p-0 bg-[#0B1116] border-gray-600"
        align="start"
      >
        <div className="flex">
          {/* Preset Options */}
          <div className="w-44 p-4 border-r border-[#2F3235]">
            <div className="space-y-2">
              {presetOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handlePresetClick(option)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedRange === option
                      ? "bg-yellow-500 text-[#525252] font-medium"
                      : "text-[#525252] hover:bg-gray-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-8">
              {renderCalendar(currentMonth)}
              {renderCalendar(getNextMonth())}
            </div>

            {/* Date/Time Inputs */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#1D2226] rounded-md">
                  <span className="text-[#BBBCBD] border-r border-[#1D2226] p-2">
                    {formatDate(tempRange.start) || "Start date"}
                  </span>
                  <span className="text-[#BBBCBD] p-2">
                    {formatTime(tempRange.start)}
                  </span>
                </div>
                <span className="text-[#BBBCBD]">–</span>
                <div className="flex items-center border border-[#1D2226] rounded-md">
                  <span className="text-[#BBBCBD] border-r border-[#1D2226] p-2">
                    {formatDate(tempRange.end) || "End date"}
                  </span>
                  <span className="text-[#BBBCBD] p-2">
                    {formatTime(tempRange.end)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={hasSelectedRange ? handleClear : handleCancel}
                  className="bg-transparent border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 rounded-md"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

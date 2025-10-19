'use client';

import React, { useState } from "react";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";

export function DatePicker({ date, setDate, placeholder = "Bir tarih seçin", className }) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setCalendarOpen(false); 
  };
  
  const displayDate = date && isValid(new Date(date)) ? format(new Date(date), "PPP") : placeholder;

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{displayDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 dropdown-content">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
        />
      </PopoverContent>
    </Popover>
  );
}
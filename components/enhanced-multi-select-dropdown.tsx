"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ChevronDownIcon, Search, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
interface EnhancedMultiSelectDropdownProps {
  placeholder: string;
  options: string[];
  onSelectionChange?: (selected: string[]) => void;
  searchPlaceholder?: string;
  maxDisplayItems?: number;
}

export function EnhancedMultiSelectDropdown({
  placeholder,
  options,
  onSelectionChange,
  searchPlaceholder = "Search...",
  maxDisplayItems = 3,
}: EnhancedMultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredOptions = options
    .filter((option) => typeof option === "string")
    .filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSelect = (option: string, checked: boolean) => {
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedItems, option];
    } else {
      newSelection = selectedItems.filter((item) => item !== option);
    }
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...filteredOptions] : [];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    onSelectionChange?.([]);
  };

  const getDisplayText = () => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1) return selectedItems[0];
    if (selectedItems.length <= maxDisplayItems) {
      return selectedItems.join(", ");
    }
    return `${selectedItems.length} items selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-auto bg-[#0A1117] border-gray-600 hover:bg-gray-700 text-left rounded-md"
        >
          <span className="truncate text-[#7A7A7A] font-medium text-[14px] leading-[20px]">
            {placeholder}
          </span>
          <div className="flex items-center gap-1">
            {/* {selectedItems.length > 0 && (
              <X
                className="h-3 w-3 hover:bg-gray-600 rounded"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              />
            )} */}
            <ChevronDownIcon className="size-5 text-[#C2C2C2]" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-0 bg-[#0A1117] border-gray-600"
        align="start"
      >
        <div className="p-4 rounded-md">
          {/* Search Input */}
          <div className="relative mb-4">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-gray-600 text-[#C2C2C2] placeholder-gray-400"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C2C2C2] h-4 w-4" />
          </div>

          {/* Select All Option */}
          {/* {filteredOptions.length > 1 && (
            <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-600">
              <Checkbox
                id="select-all"
                checked={
                  filteredOptions.length > 0 &&
                  filteredOptions.every((option) =>
                    selectedItems.includes(option)
                  )
                }
                onCheckedChange={handleSelectAll}
                className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="select-all"
                className="text-blue-400 text-sm font-medium cursor-pointer"
              >
                Select All ({filteredOptions.length})
              </label>
            </div>
          )} */}

          {/* Options List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-4">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div key={option} className="flex items-center space-x-3">
                  <Checkbox
                    id={option}
                    checked={selectedItems.includes(option)}
                    onCheckedChange={(checked) =>
                      handleSelect(option, checked as boolean)
                    }
                    className="border-[#D6D6D6] data-[state=checked]:bg-[#1C6599] data-[state=checked]:border-[#9ED2F7]"
                  />
                  <label
                    htmlFor={option}
                    className="text-[#FBBD2C] text-sm cursor-pointer flex-1 truncate"
                  >
                    {option}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-600 flex items-center justify-between">
              <span className="text-gray-400 text-xs">
                {selectedItems.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

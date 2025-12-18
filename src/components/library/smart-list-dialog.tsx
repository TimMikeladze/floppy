"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Comic, ComicList, SmartListRule } from "@/lib/types";

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface SmartListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (list: Omit<ComicList, "id" | "createdAt" | "comicIds">) => void;
  existingList?: ComicList;
}

const RULE_TYPES = [
  { value: "series", label: "Series" },
  { value: "author", label: "Author" },
  { value: "publisher", label: "Publisher" },
  { value: "status", label: "Reading Status" },
  { value: "progress", label: "Progress %" },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  series: [
    { value: "equals", label: "is exactly" },
    { value: "contains", label: "contains" },
  ],
  author: [
    { value: "equals", label: "is exactly" },
    { value: "contains", label: "contains" },
  ],
  publisher: [
    { value: "equals", label: "is exactly" },
    { value: "contains", label: "contains" },
  ],
  status: [{ value: "equals", label: "is" }],
  progress: [
    { value: "equals", label: "equals" },
    { value: "lessThan", label: "less than" },
    { value: "greaterThan", label: "greater than" },
  ],
};

const STATUS_VALUES = [
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "want", label: "Want to Read" },
];

function RuleRow({
  rule,
  index: _index,
  onUpdate,
  onRemove,
}: {
  rule: SmartListRule;
  index: number;
  onUpdate: (rule: SmartListRule) => void;
  onRemove: () => void;
}) {
  const operators = OPERATORS[rule.type] || [];

  const renderValueInput = () => {
    if (rule.type === "status") {
      return (
        <Select
          value={String(rule.value)}
          onValueChange={(value) => onUpdate({ ...rule, value })}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (rule.type === "progress") {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={String(rule.value)}
            onChange={(e) =>
              onUpdate({ ...rule, value: parseInt(e.target.value, 10) || 0 })
            }
            className="w-20 h-9"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      );
    }

    return (
      <Input
        type="text"
        value={String(rule.value)}
        onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
        placeholder="Enter value..."
        className="flex-1 h-9"
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
      <Select
        value={rule.type}
        onValueChange={(value) =>
          onUpdate({
            ...rule,
            type: value as SmartListRule["type"],
            operator: "equals",
            value: "",
          })
        }
      >
        <SelectTrigger className="w-28 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RULE_TYPES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={rule.operator}
        onValueChange={(value) =>
          onUpdate({ ...rule, operator: value as SmartListRule["operator"] })
        }
      >
        <SelectTrigger className="w-28 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderValueInput()}

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SmartListDialog({
  open,
  onOpenChange,
  onSave,
  existingList,
}: SmartListDialogProps) {
  const [name, setName] = useState(existingList?.name || "");
  const [description, setDescription] = useState(
    existingList?.description || "",
  );
  const [color, setColor] = useState(existingList?.color || PRESET_COLORS[4]);
  const [icon, setIcon] = useState(existingList?.icon || "");
  const [rules, setRules] = useState<SmartListRule[]>(
    existingList?.smartListRules || [],
  );

  const addRule = () => {
    setRules([...rules, { type: "series", operator: "contains", value: "" }]);
  };

  const updateRule = (index: number, rule: SmartListRule) => {
    const newRules = [...rules];
    newRules[index] = rule;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a list name");
      return;
    }
    if (rules.length === 0) {
      toast.error("Add at least one rule");
      return;
    }
    const validRules = rules.filter((r) => r.value !== "");
    if (validRules.length === 0) {
      toast.error("All rules need values");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon: icon || undefined,
      isSmartList: true,
      smartListRules: validRules,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {existingList ? "Edit Smart List" : "Create Smart List"}
          </DialogTitle>
          <DialogDescription>
            Smart lists automatically update based on your rules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Unread Batman"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., All unread Batman comics"
            />
          </div>

          {/* Color and Icon */}
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🦇"
                className="w-16 text-center"
                maxLength={2}
              />
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rules</label>
            <p className="text-xs text-muted-foreground">
              Comics matching ALL rules will be included
            </p>
            {rules.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  No rules yet. Add a rule to define what comics belong in this
                  list.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <RuleRow
                    key={index}
                    rule={rule}
                    index={index}
                    onUpdate={(r) => updateRule(index, r)}
                    onRemove={() => removeRule(index)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="gap-2 w-full"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {existingList ? "Save Changes" : "Create Smart List"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Apply smart list rules to filter comics.
 */
export function applySmartListRules(
  comics: Comic[],
  rules: SmartListRule[],
): Comic[] {
  if (!rules || rules.length === 0) return [];

  return comics.filter((comic) => {
    return rules.every((rule) => {
      const { type, operator, value } = rule;

      switch (type) {
        case "series": {
          const seriesValue = (comic.series || "").toLowerCase();
          const searchValue = String(value).toLowerCase();
          if (operator === "equals") return seriesValue === searchValue;
          if (operator === "contains") return seriesValue.includes(searchValue);
          return false;
        }
        case "author": {
          const authorValue = (comic.author || "").toLowerCase();
          const searchValue = String(value).toLowerCase();
          if (operator === "equals") return authorValue === searchValue;
          if (operator === "contains") return authorValue.includes(searchValue);
          return false;
        }
        case "publisher": {
          const publisherValue = (comic.publisher || "").toLowerCase();
          const searchValue = String(value).toLowerCase();
          if (operator === "equals") return publisherValue === searchValue;
          if (operator === "contains")
            return publisherValue.includes(searchValue);
          return false;
        }
        case "status": {
          if (!comic.totalPages) return value === "want";
          const progress = comic.currentPage / comic.totalPages;
          if (value === "reading") return progress > 0 && progress < 1;
          if (value === "completed") return progress >= 1;
          if (value === "want") return progress === 0;
          return false;
        }
        case "progress": {
          if (!comic.totalPages) return false;
          const progress = Math.round(
            (comic.currentPage / comic.totalPages) * 100,
          );
          const targetValue = Number(value);
          if (operator === "equals") return progress === targetValue;
          if (operator === "lessThan") return progress < targetValue;
          if (operator === "greaterThan") return progress > targetValue;
          return false;
        }
        default:
          return false;
      }
    });
  });
}

"use client"

import { useState } from "react"
import { X, Plus, Filter, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Comic } from "@/lib/types"

export interface FilterRule {
  id: string
  field: 'series' | 'author' | 'publisher' | 'status' | 'progress' | 'format' | 'hasFile'
  operator: 'equals' | 'contains' | 'lessThan' | 'greaterThan'
  value: string | number | boolean
}

export interface FilterPreset {
  id: string
  name: string
  rules: FilterRule[]
}

interface FilterBuilderProps {
  onFilterChange: (rules: FilterRule[]) => void
  activeRules: FilterRule[]
  presets?: FilterPreset[]
  onSavePreset?: (name: string, rules: FilterRule[]) => void
  onDeletePreset?: (id: string) => void
}

const FIELD_OPTIONS = [
  { value: 'series', label: 'Series' },
  { value: 'author', label: 'Author' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'status', label: 'Status' },
  { value: 'progress', label: 'Progress %' },
  { value: 'format', label: 'Format' },
  { value: 'hasFile', label: 'Has File' },
]

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  series: [
    { value: 'equals', label: 'is' },
    { value: 'contains', label: 'contains' },
  ],
  author: [
    { value: 'equals', label: 'is' },
    { value: 'contains', label: 'contains' },
  ],
  publisher: [
    { value: 'equals', label: 'is' },
    { value: 'contains', label: 'contains' },
  ],
  status: [
    { value: 'equals', label: 'is' },
  ],
  progress: [
    { value: 'equals', label: 'equals' },
    { value: 'lessThan', label: 'less than' },
    { value: 'greaterThan', label: 'greater than' },
  ],
  format: [
    { value: 'equals', label: 'is' },
  ],
  hasFile: [
    { value: 'equals', label: 'is' },
  ],
}

const STATUS_VALUES = [
  { value: 'reading', label: 'Reading' },
  { value: 'completed', label: 'Completed' },
  { value: 'want', label: 'Want to Read' },
]

const FORMAT_VALUES = [
  { value: 'cbz', label: 'CBZ' },
  { value: 'cbr', label: 'CBR' },
  { value: 'pdf', label: 'PDF' },
]

function FilterRuleRow({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: FilterRule
  onUpdate: (rule: FilterRule) => void
  onRemove: () => void
}) {
  const operators = OPERATOR_OPTIONS[rule.field] || []

  const renderValueInput = () => {
    if (rule.field === 'status') {
      return (
        <Select
          value={String(rule.value)}
          onValueChange={(value) => onUpdate({ ...rule, value })}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (rule.field === 'format') {
      return (
        <Select
          value={String(rule.value)}
          onValueChange={(value) => onUpdate({ ...rule, value })}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_VALUES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (rule.field === 'hasFile') {
      return (
        <Select
          value={String(rule.value)}
          onValueChange={(value) => onUpdate({ ...rule, value: value === 'true' })}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (rule.field === 'progress') {
      return (
        <Input
          type="number"
          min={0}
          max={100}
          value={String(rule.value)}
          onChange={(e) => onUpdate({ ...rule, value: parseInt(e.target.value) || 0 })}
          className="w-20 h-8"
        />
      )
    }

    return (
      <Input
        type="text"
        value={String(rule.value)}
        onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
        placeholder="Value..."
        className="w-32 h-8"
      />
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50">
      <Select
        value={rule.field}
        onValueChange={(value) =>
          onUpdate({
            ...rule,
            field: value as FilterRule['field'],
            operator: 'equals',
            value: '',
          })
        }
      >
        <SelectTrigger className="w-28 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={rule.operator}
        onValueChange={(value) =>
          onUpdate({ ...rule, operator: value as FilterRule['operator'] })
        }
      >
        <SelectTrigger className="w-28 h-8">
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
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function FilterBuilder({
  onFilterChange,
  activeRules,
  presets = [],
  onSavePreset,
  onDeletePreset,
}: FilterBuilderProps) {
  const [open, setOpen] = useState(false)
  const [rules, setRules] = useState<FilterRule[]>(activeRules)
  const [presetName, setPresetName] = useState("")
  const [showSavePreset, setShowSavePreset] = useState(false)

  const addRule = () => {
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      field: 'series',
      operator: 'contains',
      value: '',
    }
    setRules([...rules, newRule])
  }

  const updateRule = (index: number, rule: FilterRule) => {
    const newRules = [...rules]
    newRules[index] = rule
    setRules(newRules)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const applyFilters = () => {
    onFilterChange(rules)
    setOpen(false)
  }

  const clearFilters = () => {
    setRules([])
    onFilterChange([])
  }

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), rules)
      setPresetName("")
      setShowSavePreset(false)
    }
  }

  const loadPreset = (preset: FilterPreset) => {
    setRules(preset.rules)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filters
          {activeRules.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeRules.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filter Comics</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Presets */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Saved Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                      className="h-7"
                    >
                      {preset.name}
                    </Button>
                    {onDeletePreset && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDeletePreset(preset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter rules */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filter Rules
            </label>
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No filters applied. Add a filter to narrow down your comics.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <FilterRuleRow
                    key={rule.id}
                    rule={rule}
                    onUpdate={(r) => updateRule(index, r)}
                    onRemove={() => removeRule(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add rule button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addRule}
            className="gap-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Add Filter
          </Button>

          {/* Save preset */}
          {rules.length > 0 && onSavePreset && (
            <div className="pt-2 border-t">
              {showSavePreset ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="h-8"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <Button size="sm" onClick={handleSavePreset}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSavePreset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavePreset(true)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Preset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={clearFilters}>
            Clear All
          </Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Apply filter rules to a list of comics.
 */
export function applyFilterRules(comics: Comic[], rules: FilterRule[]): Comic[] {
  if (rules.length === 0) return comics

  return comics.filter((comic) => {
    return rules.every((rule) => {
      const { field, operator, value } = rule

      switch (field) {
        case 'series': {
          const seriesValue = comic.series?.toLowerCase() || ''
          const searchValue = String(value).toLowerCase()
          if (operator === 'equals') return seriesValue === searchValue
          if (operator === 'contains') return seriesValue.includes(searchValue)
          return true
        }
        case 'author': {
          const authorValue = comic.author?.toLowerCase() || ''
          const searchValue = String(value).toLowerCase()
          if (operator === 'equals') return authorValue === searchValue
          if (operator === 'contains') return authorValue.includes(searchValue)
          return true
        }
        case 'publisher': {
          const publisherValue = comic.publisher?.toLowerCase() || ''
          const searchValue = String(value).toLowerCase()
          if (operator === 'equals') return publisherValue === searchValue
          if (operator === 'contains') return publisherValue.includes(searchValue)
          return true
        }
        case 'status': {
          if (!comic.totalPages) return value === 'want'
          const progress = comic.currentPage / comic.totalPages
          if (value === 'reading') return progress > 0 && progress < 1
          if (value === 'completed') return progress >= 1
          if (value === 'want') return progress === 0
          return true
        }
        case 'progress': {
          if (!comic.totalPages) return false
          const progress = Math.round((comic.currentPage / comic.totalPages) * 100)
          const targetValue = Number(value)
          if (operator === 'equals') return progress === targetValue
          if (operator === 'lessThan') return progress < targetValue
          if (operator === 'greaterThan') return progress > targetValue
          return true
        }
        case 'format': {
          return comic.format === value
        }
        case 'hasFile': {
          return comic.hasFile === value
        }
        default:
          return true
      }
    })
  })
}

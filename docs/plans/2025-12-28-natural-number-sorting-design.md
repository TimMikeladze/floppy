# Natural Number Sorting for Comic Titles

## Problem

The current title sorting uses `localeCompare()`, which performs lexicographic sorting. Comic issues sort incorrectly:
- "Batman #10" appears before "Batman #2"
- "Spider-Man 20" appears before "Spider-Man 3"

Users browsing comics by title encounter poor ordering.

## Solution

Implement natural number sorting using `Intl.Collator` with the `numeric: true` option. This option handles numbers within strings intelligently.

## Implementation

### 1. Create Sort Utility (`src/lib/sort-utils.ts`)

Create a reusable collator instance:

```typescript
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
})
```

Options:
- `numeric: true` - Enables natural number sorting
- `sensitivity: 'base'` - Case-insensitive comparison

### 2. Update Comic Table Sorting

In `src/components/library/comic-table.tsx`, replace the sorting logic:

**Current (lines 67-75):**
```typescript
case "title":
  comparison = a.title.localeCompare(b.title)
  break
case "series":
  comparison = (a.series || "").localeCompare(b.series || "")
  break
case "author":
  comparison = (a.author || "").localeCompare(b.author || "")
  break
```

**Updated:**
```typescript
case "title":
  comparison = naturalCollator.compare(a.title, b.title)
  break
case "series":
  comparison = naturalCollator.compare(a.series || "", b.series || "")
  break
case "author":
  comparison = naturalCollator.compare(a.author || "", b.author || "")
  break
```

## Expected Behavior

### Before
```
Batman #1
Batman #10
Batman #2
Batman #20
Spider-Man 1
Spider-Man 10
Spider-Man 2
```

### After
```
Batman #1
Batman #2
Batman #10
Batman #20
Spider-Man 1
Spider-Man 2
Spider-Man 10
```

## Impact

- Title, series, and author sorting in the comic table improves
- Titles display unchanged
- Sort order alone improves; no breaking changes occur
- Any string with embedded numbers benefits

## Testing

Manual testing should verify:
1. Comic titles with issue numbers sort correctly
2. Series names with numbers sort naturally
3. Sorting respects ascending/descending direction
4. Non-numeric titles continue to sort alphabetically

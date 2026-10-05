# UX Change Implementation Summary

## 1. Arabic Locale (`src/locales/ar.ts`)
| Key | Before | After |
|---|---|---|
| `installments.receivable` | `"مدين"` | `"لنا عند الطرف"` |
| `installments.payable` | `"دائن"` | `"علينا للطرف"` |
| `offsets.receivable` | `"قسط مدين"` | `"قسط لنا عند الطرف"` |
| `offsets.payable` | `"قسط دائن"` | `"قسط علينا للطرف"` |

*Backend enum values (`receivable`/`payable`) unchanged.*

## 2. Installments Index Page (`src/modules/sales/pages/InstallmentsIndexPage.vue`)
- **Visible columns**: reduced from 13 to exactly 9
  - Shown: `id`, `party`, `direction`, `source`, `amount`, `remaining_amount`, `due_date`, `status`, `actions`
  - Removed: `source_type`, `settled_amount`, `paid_at`, `payment_method`
- **Cell templates**: removed slots for 4 removed columns
- **Party cell**: added Tailwind `truncate` class to long names
- **Direction**: remains visible (All tab mixes both directions)
- **Actions**: preserved as final column
- **Removed data**: still available in details modal and filter panel

## Build Result
`npm run build` — ✓ built in 17.78s (no errors)
import type { BaseSelectOption } from '@/components/forms/BaseSelect.vue'
import type { Category, CategoryTreeNode } from '../types'

export interface CategoryTreeRow {
  category: CategoryTreeNode
  depth: number
  path: string
  parentName: string
  ancestorIds: number[]
  hasChildren: boolean
}

export function categoryDisplayName(category: Pick<Category, 'id' | 'name' | 'translation_name'>, locale = 'en'): string {
  const language = locale.startsWith('ar') ? 'ar' : 'en'

  return category.translation_name?.[language]
    ?? category.name
    ?? category.translation_name?.ar
    ?? category.translation_name?.en
    ?? `#${category.id}`
}

export function flattenCategoryTree(nodes: CategoryTreeNode[], locale = 'en', rootLabel = 'Root'): CategoryTreeRow[] {
  const rows: CategoryTreeRow[] = []
  const visited = new Set<number>()

  function visit(items: CategoryTreeNode[] = [], depth = 0, ancestry: string[] = [], parentName = rootLabel, ancestorIds: number[] = []) {
    for (const category of items) {
      if (!category?.id || visited.has(category.id)) continue
      visited.add(category.id)

      const label = categoryDisplayName(category, locale)
      const path = [...ancestry, label].join(' / ')
      const children = category.children ?? []
      rows.push({ category, depth, path, parentName, ancestorIds, hasChildren: children.length > 0 })
      visit(children, depth + 1, [...ancestry, label], label, [...ancestorIds, category.id])
    }
  }

  visit(nodes)

  return rows
}

export function filterCategoryTreeRowsByCollapsed(
  rows: CategoryTreeRow[],
  collapsedIds: ReadonlySet<number> | readonly number[],
): CategoryTreeRow[] {
  const collapsed = collapsedIds instanceof Set ? collapsedIds : new Set(collapsedIds)
  if (!collapsed.size) return rows

  return rows.filter((row) => !row.ancestorIds.some((id) => collapsed.has(id)))
}

export function categoryTreeRowsToOptions(rows: CategoryTreeRow[], locale = 'en'): BaseSelectOption<number>[] {
  return rows.map((row) => ({
    label: categoryDisplayName(row.category, locale),
    value: row.category.id,
    description: row.path,
    searchText: [row.path, row.category.translation_name?.ar, row.category.translation_name?.en].filter(Boolean).join(' '),
    depth: row.depth,
  }))
}

export function categoryTreeRowsToPathMap(rows: CategoryTreeRow[]): Map<number, string> {
  return new Map(rows.map((row) => [row.category.id, row.path]))
}

export function categoryTreePathMap(nodes: CategoryTreeNode[], locale = 'en'): Map<number, string> {
  return categoryTreeRowsToPathMap(flattenCategoryTree(nodes, locale))
}

export function categoryPathFromMap(
  category: Pick<Category, 'id' | 'name' | 'translation_name'> | null | undefined,
  pathMap: ReadonlyMap<number, string>,
  locale = 'en',
): string {
  if (!category) return '—'
  return pathMap.get(category.id) ?? categoryDisplayName(category, locale)
}

export function categoryDisabledSet(nodes: CategoryTreeNode[], currentId?: number | string | null): Set<number> {
  const disabled = new Set<number>()
  const targetId = currentId === null || currentId === undefined || currentId === '' ? null : Number(currentId)
  if (!targetId || Number.isNaN(targetId)) return disabled

  const visited = new Set<number>()

  function collect(category: CategoryTreeNode) {
    if (!category?.id || visited.has(category.id)) return
    visited.add(category.id)
    disabled.add(category.id)
    for (const child of category.children ?? []) collect(child)
  }

  function find(items: CategoryTreeNode[] = []) {
    for (const category of items) {
      if (!category?.id || visited.has(category.id)) continue
      if (category.id === targetId) {
        collect(category)
        return true
      }
      visited.add(category.id)
      if (find(category.children ?? [])) return true
    }
    return false
  }

  find(nodes)

  return disabled
}

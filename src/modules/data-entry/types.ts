export interface TranslationMap {
  ar?: string | null
  en?: string | null
}

export interface Country {
  id: number
  translation_name?: string | null
  name: TranslationMap
  translation_nationality?: string | null
  nationality: TranslationMap
  flag?: string | null
  code: string
  phone_code: string
  phone_length: number
  created_at?: string | null
}

export interface Brand {
  id: number
  name: string | null
  translation_name: TranslationMap
  description?: string | null
  translation_description?: TranslationMap
  is_active?: boolean
  created_at?: string | null
}

export interface Category extends Brand {
  parent_id?: number | null
  parent?: Category | null
  children?: CategoryTreeNode[]
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[]
}

export interface CountryPayload {
  name: TranslationMap
  nationality: TranslationMap
  code: string
  phone_code: string
  phone_length: string | number
  flag?: File | null
}

export interface TaxonomyPayload {
  name: TranslationMap
  description: TranslationMap
  parent_id?: number | null
  is_active: boolean
}

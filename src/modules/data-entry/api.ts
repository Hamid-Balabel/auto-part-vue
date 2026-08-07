import { http, unwrapData } from '@/api/http'
import { toFormData } from '@/api/formData'
import type { ApiEnvelope, ListQuery, Paginated } from '@/types/api'
import type { Brand, Category, Country, CountryPayload, TaxonomyPayload } from './types'

type DataEntryResource = 'countries' | 'categories' | 'brands'
type ResourceMap = {
  countries: Country
  categories: Category
  brands: Brand
}

export async function listResource<T extends DataEntryResource>(resource: T, query: ListQuery = {}): Promise<Paginated<ResourceMap[T]> | ResourceMap[T][]> {
  const response = await http.get<ApiEnvelope<Paginated<ResourceMap[T]> | ResourceMap[T][]>>(`/${resource}`, { params: query })

  return unwrapData(response)
}

export async function listCountries(query: ListQuery = {}): Promise<Paginated<Country> | Country[]> {
  const response = await http.get<ApiEnvelope<Paginated<Country> | Country[]>>('/countries', { params: query })

  return unwrapData(response)
}

export async function getResource<T extends DataEntryResource>(resource: T, id: number | string): Promise<ResourceMap[T]> {
  const response = await http.get<ApiEnvelope<ResourceMap[T]>>(`/${resource}/${id}`)

  return unwrapData(response)
}

export async function createCountry(payload: CountryPayload): Promise<Country> {
  const response = await http.post<ApiEnvelope<Country>>('/countries', toFormData({ ...payload }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return unwrapData(response)
}

export async function updateCountry(id: number | string, payload: CountryPayload): Promise<Country> {
  const formData = toFormData({ ...payload, _method: 'PUT' })
  const response = await http.post<ApiEnvelope<Country>>(`/countries/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return unwrapData(response)
}

export async function createTaxonomy(resource: 'categories' | 'brands', payload: TaxonomyPayload): Promise<Category | Brand> {
  const response = await http.post<ApiEnvelope<Category | Brand>>(`/${resource}`, payload)

  return unwrapData(response)
}

export async function updateTaxonomy(resource: 'categories' | 'brands', id: number | string, payload: TaxonomyPayload): Promise<Category | Brand> {
  const response = await http.put<ApiEnvelope<Category | Brand>>(`/${resource}/${id}`, payload)

  return unwrapData(response)
}

export async function deleteResource(resource: DataEntryResource, id: number): Promise<void> {
  await http.delete(`/${resource}/delete`, { data: { id } })
}

export async function toggleResource(resource: DataEntryResource, id: number): Promise<void> {
  await http.put(`/${resource}/toggle-active`, { id })
}

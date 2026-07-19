import type { RouteRecordRaw } from 'vue-router'

export const dataEntryRoutes: RouteRecordRaw[] = [
  {
    path: 'countries',
    name: 'countries.index',
    component: () => import('./pages/CountriesIndexPage.vue'),
    meta: { permission: ['create-country', 'update-country', 'delete-country', 'toggle-active-country'] },
  },
  {
    path: 'countries/create',
    name: 'countries.create',
    component: () => import('./pages/CountryFormPage.vue'),
    meta: { permission: 'create-country' },
  },
  {
    path: 'countries/:id/edit',
    name: 'countries.edit',
    component: () => import('./pages/CountryFormPage.vue'),
    props: true,
    meta: { permission: 'update-country' },
  },
  {
    path: 'categories',
    name: 'categories.index',
    component: () => import('./pages/TaxonomyIndexPage.vue'),
    props: { resource: 'categories', title: 'Categories' },
    meta: { permission: ['view-all-category', 'view-own-category', 'create-category', 'update-category', 'delete-category', 'toggle-active-category'] },
  },
  {
    path: 'categories/create',
    name: 'categories.create',
    component: () => import('./pages/TaxonomyFormPage.vue'),
    props: { resource: 'categories', title: 'Category' },
    meta: { permission: 'create-category' },
  },
  {
    path: 'categories/:id/edit',
    name: 'categories.edit',
    component: () => import('./pages/TaxonomyFormPage.vue'),
    props: (route) => ({ resource: 'categories', title: 'Category', id: route.params.id }),
    meta: { permission: 'update-category' },
  },
  {
    path: 'brands',
    name: 'brands.index',
    component: () => import('./pages/TaxonomyIndexPage.vue'),
    props: { resource: 'brands', title: 'Brands' },
    meta: { permission: ['view-all-brand', 'view-own-brand', 'create-brand', 'update-brand', 'delete-brand', 'toggle-active-brand'] },
  },
  {
    path: 'brands/create',
    name: 'brands.create',
    component: () => import('./pages/TaxonomyFormPage.vue'),
    props: { resource: 'brands', title: 'Brand' },
    meta: { permission: 'create-brand' },
  },
  {
    path: 'brands/:id/edit',
    name: 'brands.edit',
    component: () => import('./pages/TaxonomyFormPage.vue'),
    props: (route) => ({ resource: 'brands', title: 'Brand', id: route.params.id }),
    meta: { permission: 'update-brand' },
  },
]

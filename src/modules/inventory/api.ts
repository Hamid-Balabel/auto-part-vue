import { http, unwrapData } from "@/api/http";
import { toFormData } from "@/api/formData";
import type { ApiEnvelope, ListQuery, Paginated } from "@/types/api";
import type {
  Customer,
  CustomerListQuery,
  CustomerPayload,
  Party,
  PartyListQuery,
  PartyPayload,
  Branch,
  BranchListQuery,
  BranchPayload,
  Merchant,
  MerchantListQuery,
  MerchantPayload,
  Product,
  ProductListQuery,
  ProductItem,
  ProductItemListQuery,
  ProductItemPayload,
  ProductItemBatch,
  ProductOption,
  ProductOptionListQuery,
  ProductOptionPayload,
  ProductOptionValue,
  ProductPayload,
  ProductWithItemsPayload,
  StandaloneOptionValuePayload,
  Stock,
  StockListQuery,
  PurchaseStockPayload,
  PurchaseBulkStockPayload,
  StockTransfer,
  StockTransferLogListQuery,
  StockTransferPayload,
  Warehouse,
  WarehouseListQuery,
  WarehousePayload,
} from "./types";

export async function listBranches(
  query: BranchListQuery = {},
): Promise<Paginated<Branch> | Branch[]> {
  const response = await http.get<ApiEnvelope<Paginated<Branch> | Branch[]>>(
    "/branches",
    { params: query },
  );
  return unwrapData(response);
}

export async function getBranch(id: string | number): Promise<Branch> {
  const response = await http.get<ApiEnvelope<Branch>>(`/branches/${id}`);
  return unwrapData(response);
}

export async function createBranch(payload: BranchPayload): Promise<Branch> {
  const response = await http.post<ApiEnvelope<Branch>>("/branches", payload);
  return unwrapData(response);
}

export async function updateBranch(
  id: string | number,
  payload: Partial<BranchPayload>,
): Promise<Branch> {
  const response = await http.put<ApiEnvelope<Branch>>(
    `/branches/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function updateBranchStatus(
  id: string | number,
  is_active: boolean,
): Promise<Branch> {
  const response = await http.patch<ApiEnvelope<Branch>>(
    `/branches/${id}/status`,
    { is_active },
  );
  return unwrapData(response);
}

export async function setCurrentBranch(
  id: string | number,
): Promise<Branch> {
  const response = await http.patch<ApiEnvelope<Branch>>(
    `/branches/${id}/set-current`,
  );
  return unwrapData(response);
}

export async function deleteBranch(id: number): Promise<void> {
  await http.delete("/branches/delete", { data: { id } });
}

export async function listCustomers(
  query: CustomerListQuery = {},
): Promise<Paginated<Customer> | Customer[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<Customer> | Customer[]>
  >("/customers", { params: query });
  return unwrapData(response);
}

export async function getCustomer(id: string | number): Promise<Customer> {
  const response = await http.get<ApiEnvelope<Customer>>(`/customers/${id}`);
  return unwrapData(response);
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await http.post<ApiEnvelope<Customer>>(
    "/customers",
    payload,
  );
  return unwrapData(response);
}

export async function updateCustomer(
  id: string | number,
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await http.put<ApiEnvelope<Customer>>(
    `/customers/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function deleteCustomer(id: number): Promise<void> {
  await http.delete("/customers/delete", { data: { id } });
}

export async function toggleCustomer(id: number): Promise<void> {
  await http.put("/customers/toggle-active", { id });
}

export async function listMerchants(
  query: MerchantListQuery = {},
): Promise<Paginated<Merchant> | Merchant[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<Merchant> | Merchant[]>
  >("/merchants", { params: query });
  return unwrapData(response);
}

export async function getMerchant(id: string | number): Promise<Merchant> {
  const response = await http.get<ApiEnvelope<Merchant>>(`/merchants/${id}`);
  return unwrapData(response);
}

export async function createMerchant(
  payload: MerchantPayload,
): Promise<Merchant> {
  const response = await http.post<ApiEnvelope<Merchant>>(
    "/merchants",
    payload,
  );
  return unwrapData(response);
}

export async function updateMerchant(
  id: string | number,
  payload: MerchantPayload,
): Promise<Merchant> {
  const response = await http.put<ApiEnvelope<Merchant>>(
    `/merchants/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function deleteMerchant(id: number): Promise<void> {
  await http.delete("/merchants/delete", { data: { id } });
}

export async function toggleMerchant(id: number): Promise<void> {
  await http.put("/merchants/toggle-active", { id });
}

export async function listParties(
  query: PartyListQuery = {},
): Promise<Paginated<Party> | Party[]> {
  const response = await http.get<ApiEnvelope<Paginated<Party> | Party[]>>(
    "/parties",
    { params: query },
  );
  return unwrapData(response);
}

export async function getParty(id: string | number): Promise<Party> {
  const response = await http.get<ApiEnvelope<Party>>(`/parties/${id}`);
  return unwrapData(response);
}

export async function createParty(payload: PartyPayload): Promise<Party> {
  const response = await http.post<ApiEnvelope<Party>>("/parties", payload);
  return unwrapData(response);
}

export async function updateParty(
  id: string | number,
  payload: PartyPayload,
): Promise<Party> {
  const response = await http.put<ApiEnvelope<Party>>(`/parties/${id}`, payload);
  return unwrapData(response);
}

export async function deleteParty(id: number): Promise<void> {
  await http.delete("/parties/delete", { data: { id } });
}

export async function toggleParty(id: number): Promise<void> {
  await http.put("/parties/toggle-active", { id });
}

export async function restoreParty(id: number): Promise<void> {
  await http.post("/parties/restore", { id });
}

export async function forceDeleteParty(id: number): Promise<void> {
  await http.delete("/parties/force-delete", { data: { id } });
}

export async function restoreMerchant(id: number): Promise<void> {
  await http.post("/merchants/restore", { id });
}

export async function forceDeleteMerchant(id: number): Promise<void> {
  await http.delete("/merchants/force-delete", { data: { id } });
}

export async function listWarehouses(
  query: WarehouseListQuery = {},
): Promise<Paginated<Warehouse> | Warehouse[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<Warehouse> | Warehouse[]>
  >("/warehouses", { params: query });
  return unwrapData(response);
}

export async function getWarehouse(id: string | number): Promise<Warehouse> {
  const response = await http.get<ApiEnvelope<Warehouse>>(`/warehouses/${id}`);
  return unwrapData(response);
}

export async function createWarehouse(
  payload: WarehousePayload,
): Promise<Warehouse> {
  const response = await http.post<ApiEnvelope<Warehouse>>(
    "/warehouses",
    payload,
  );
  return unwrapData(response);
}

export async function updateWarehouse(
  id: string | number,
  payload: WarehousePayload,
): Promise<Warehouse> {
  const response = await http.put<ApiEnvelope<Warehouse>>(
    `/warehouses/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function deleteWarehouse(id: number): Promise<void> {
  await http.delete("/warehouses/delete", { data: { id } });
}

export async function toggleWarehouse(id: number): Promise<void> {
  await http.put("/warehouses/toggle-active", { id });
}

export async function listProductItems(
  query: ProductItemListQuery = {},
): Promise<Paginated<ProductItem> | ProductItem[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<ProductItem> | ProductItem[]>
  >("/product-items", { params: query });
  return unwrapData(response);
}

export async function listProducts(
  query: ProductListQuery = {},
): Promise<Paginated<Product> | Product[]> {
  const response = await http.get<ApiEnvelope<Paginated<Product> | Product[]>>(
    "/products",
    { params: query },
  );
  return unwrapData(response);
}

export async function getProduct(id: string | number): Promise<Product> {
  const response = await http.get<ApiEnvelope<Product>>(`/products/${id}`);
  return unwrapData(response);
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const response = await http.post<ApiEnvelope<Product>>("/products", payload);
  return unwrapData(response);
}

export async function createProductWithItems(
  payload: ProductWithItemsPayload,
): Promise<Product> {
  const response = await http.post<ApiEnvelope<Product>>(
    "/product-items/bulck",
    toFormData({ ...payload }),
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return unwrapData(response);
}

export async function updateProduct(
  id: string | number,
  payload: ProductPayload,
): Promise<Product> {
  const response = await http.put<ApiEnvelope<Product>>(
    `/products/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function deleteProduct(id: number): Promise<void> {
  await http.delete("/products/delete", { data: { id } });
}

export async function toggleProduct(id: number): Promise<void> {
  await http.put("/products/toggle-active", { id });
}

export async function getProductItem(
  id: string | number,
): Promise<ProductItem> {
  const response = await http.get<ApiEnvelope<ProductItem>>(
    `/product-items/${id}`,
  );
  return unwrapData(response);
}

export async function createProductItem(
  payload: ProductItemPayload,
): Promise<ProductItem> {
  const response = await http.post<ApiEnvelope<ProductItem>>(
    "/product-items",
    toFormData({ ...payload }),
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return unwrapData(response);
}

export async function updateProductItem(
  id: string | number,
  payload: ProductItemPayload,
): Promise<ProductItem> {
  const formData = toFormData({ ...payload, _method: "PUT" });
  if (payload.max_discount === null || payload.max_discount === '') {
    formData.set('max_discount', '')
  }
  const response = await http.post<ApiEnvelope<ProductItem>>(
    `/product-items/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return unwrapData(response);
}

export async function deleteProductItemImage(imageId: number): Promise<void> {
  await http.delete(`/product-items/images/${imageId}`);
}

export async function deleteProductItem(id: number): Promise<void> {
  await http.delete("/product-items/delete", { data: { id } });
}

export async function toggleProductItem(id: number): Promise<void> {
  await http.put("/product-items/toggle-active", { id });
}

export async function listAvailableBatches(
  itemId: string | number,
  warehouseId: string | number,
): Promise<ProductItemBatch[]> {
  const response = await http.get<ApiEnvelope<ProductItemBatch[]>>(
    `/product-items/${itemId}/batches`,
    { params: { warehouse_id: warehouseId } },
  );
  return unwrapData(response);
}

export async function listOptionValues(
  query: ListQuery = {},
): Promise<Paginated<ProductOptionValue> | ProductOptionValue[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<ProductOptionValue> | ProductOptionValue[]>
  >("/option-values", { params: query });
  return unwrapData(response);
}

export async function listProductOptions(
  query: ProductOptionListQuery = {},
): Promise<Paginated<ProductOption> | ProductOption[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<ProductOption> | ProductOption[]>
  >("/product-options", { params: query });
  return unwrapData(response);
}

export async function getProductOption(
  id: string | number,
): Promise<ProductOption> {
  const response = await http.get<ApiEnvelope<ProductOption>>(
    `/product-options/${id}`,
  );
  return unwrapData(response);
}

export async function createProductOption(
  payload: ProductOptionPayload,
): Promise<ProductOption> {
  const response = await http.post<ApiEnvelope<ProductOption>>(
    "/product-options",
    payload,
  );
  return unwrapData(response);
}

export async function updateProductOption(
  id: string | number,
  payload: ProductOptionPayload,
): Promise<ProductOption> {
  const response = await http.put<ApiEnvelope<ProductOption>>(
    `/product-options/${id}`,
    payload,
  );
  return unwrapData(response);
}

export async function deleteProductOption(id: number): Promise<void> {
  await http.delete("/product-options/delete", { data: { id } });
}

export async function toggleProductOption(id: number): Promise<void> {
  await http.put("/product-options/toggle-active", { id });
}

export async function createOptionValue(
  payload: StandaloneOptionValuePayload,
): Promise<ProductOptionValue> {
  const response = await http.post<ApiEnvelope<ProductOptionValue>>(
    "/option-values",
    payload,
  );
  return unwrapData(response);
}

export async function listStocks(
  query: StockListQuery = {},
): Promise<Paginated<Stock> | Stock[]> {
  const response = await http.get<ApiEnvelope<Paginated<Stock> | Stock[]>>(
    "/stocks",
    { params: query },
  );
  return unwrapData(response);
}

export async function transferStock(
  payload: StockTransferPayload,
): Promise<StockTransfer> {
  const response = await http.post<ApiEnvelope<StockTransfer>>(
    "/stocks/transfer",
    payload,
  );
  return unwrapData(response);
}

export async function listStockTransferLogs(
  query: StockTransferLogListQuery = {},
): Promise<Paginated<StockTransfer> | StockTransfer[]> {
  const response = await http.get<
    ApiEnvelope<Paginated<StockTransfer> | StockTransfer[]>
  >("/stock-transfer-logs", { params: query });
  return unwrapData(response);
}

export async function getStockTransferLog(
  id: string | number,
): Promise<StockTransfer> {
  const response = await http.get<ApiEnvelope<StockTransfer>>(
    `/stock-transfer-logs/${id}`,
  );
  return unwrapData(response);
}

export async function getStock(id: string | number): Promise<Stock> {
  const response = await http.get<ApiEnvelope<Stock>>(`/stocks/${id}`);
  return unwrapData(response);
}

export async function purchaseStock(
  payload: PurchaseStockPayload,
): Promise<ProductItemBatch> {
  const response = await http.post<ApiEnvelope<ProductItemBatch>>(
    "/stocks/purchase",
    payload,
  );
  return unwrapData(response);
}

export async function purchaseStockBulk(
  payload: PurchaseBulkStockPayload,
): Promise<ProductItemBatch> {
  const response = await http.post<ApiEnvelope<ProductItemBatch>>(
    "/stocks/purchase-bulk",
    payload,
  );
  return unwrapData(response);
}

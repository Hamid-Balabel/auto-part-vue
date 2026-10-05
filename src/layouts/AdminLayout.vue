<script setup lang="ts">
import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  Building2,
  GitBranch,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Database,
  Flag,
  Menu,
  Store,
  Package2,
  PackageSearch,
  SlidersHorizontal,
  PanelsTopLeft,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
  X,
} from "@lucide/vue";
import { computed, ref, type Component } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/ui/BaseButton.vue";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher.vue";
import CurrentBranchDialog from "@/modules/inventory/components/CurrentBranchDialog.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";
import { isRootOrAdmin } from "@/utils/authNavigation";
import type { PermissionRequirement } from "@/utils/permissions";

interface NavItem {
  labelKey: string;
  icon: Component;
  route?: string;
  module?: string;
  permission: PermissionRequirement;
  permissionAll?: string[];
}

interface NavGroup {
  key:
    | "dataEntry"
    | "warehouses"
    | "sales"
    | "reports"
    | "users"
    | "settings";
  labelKey: string;
  icon: Component;
  items: NavItem[];
}

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { can } = usePermissions();
const { locale, t } = useI18n();
const sidebarOpen = ref(false);
const openGroups = ref<Record<NavGroup["key"], boolean>>({
  dataEntry: false,
  warehouses: false,
  sales: false,
  reports: false,
  users: false,
  settings: false,
});

const isRtl = computed(() => locale.value === "ar");
const canAccessDashboard = computed(() => isRootOrAdmin(auth.user));
const canAccessQuickSale = computed(() => can("create-order"));

const navGroups: NavGroup[] = [
  {
    key: "dataEntry",
    labelKey: "nav.dataEntry",
    icon: Database,
    items: [
      {
        labelKey: "nav.products",
        icon: PackageSearch,
        route: "products.index",
        permission: [
          "view-all-product",
          "view-own-product",
          "read-product",
          "create-product",
          "update-product",
          "delete-product",
        ],
      },
      {
        labelKey: "nav.productItems",
        icon: Boxes,
        route: "product-items.index",
        permission: [
          "view-all-product-item",
          "view-own-product-item",
          "read-product-item",
          "create-product-item",
          "update-product-item",
          "delete-product-item",
        ],
      },
      {
        labelKey: "nav.productOptions",
        icon: SlidersHorizontal,
        route: "product-options.index",
        permission: [
          "read-product-option",
          "view-all-product-option",
          "view-own-product-option",
          "create-product-option",
          "update-product-option",
          "delete-product-option",
        ],
      },
      {
        labelKey: "nav.categories",
        icon: Tags,
        route: "categories.index",
        permission: [
          "view-all-category",
          "view-own-category",
          "create-category",
          "update-category",
          "delete-category",
          "toggle-active-category",
        ],
      },
      {
        labelKey: "nav.brands",
        icon: ShieldCheck,
        route: "brands.index",
        permission: [
          "view-all-brand",
          "view-own-brand",
          "create-brand",
          "update-brand",
          "delete-brand",
          "toggle-active-brand",
        ],
      },
      {
        labelKey: "nav.parties",
        icon: Users,
        route: "parties.index",
        permission: ["view-all-party", "view-own-party"],
        permissionAll: ["read-party"],
      },
      {
        labelKey: "nav.customers",
        icon: Users,
        route: "customers.index",
        permission: [
          "view-all-customer",
          "view-own-customer",
          "view-customer",
          "read-customer",
          "create-customer",
          "update-customer",
          "delete-customer",
        ],
      },
      {
        labelKey: "nav.merchants",
        icon: Store,
        route: "merchants.index",
        permission: ["view-all-merchant", "view-own-merchant"],
        permissionAll: ["read-merchant"],
      },
      {
        labelKey: "nav.branches",
        icon: GitBranch,
        route: "branches.index",
        permission: "read-branch",
      },
      {
        labelKey: "nav.countries",
        icon: Flag,
        route: "countries.index",
        permission: [
          "create-country",
          "update-country",
          "delete-country",
          "toggle-active-country",
        ],
      },
    ],
  },
  {
    key: "warehouses",
    labelKey: "nav.warehouseManagement",
    icon: Warehouse,
    items: [
      {
        labelKey: "nav.warehouses",
        icon: Warehouse,
        route: "warehouses.index",
        permission: [
          "view-all-warehouse",
          "view-own-warehouse",
          "view-warehouse",
          "read-warehouse",
          "create-warehouse",
          "update-warehouse",
          "delete-warehouse",
        ],
      },
      {
        labelKey: "nav.stocks",
        icon: Building2,
        route: "stocks.index",
        permission: ["read-stock", "create-stock", "update-stock"],
      },
      {
        labelKey: "nav.stockTransfer",
        icon: ArrowRightLeft,
        route: "stocks.transfer",
        permission: "transfer-stock",
        permissionAll: ["read-stock"],
      },
      {
        labelKey: "nav.stockTransferLogs",
        icon: ClipboardList,
        route: "stock-transfer-logs.index",
        permission: "read-stock-transfer",
      },
    ],
  },
  {
    key: "sales",
    labelKey: "nav.sales",
    icon: ShoppingCart,
    items: [
      {
        labelKey: "nav.orders",
        icon: ClipboardList,
        route: "orders.index",
        permission: ["view-all-order", "view-own-order"],
      },
      {
        labelKey: "nav.purchases",
        icon: ReceiptText,
        route: "purchases.index",
        permission: ["read-purchase", "view-all-purchase", "view-own-purchase"],
      },
      {
        labelKey: "nav.installments",
        icon: CreditCard,
        route: "installments.index",
        permission: [
          "view-all-installment",
          "view-own-installment",
        ],
      },
      {
        labelKey: "nav.installmentOffsets",
        icon: ArrowRightLeft,
        route: "installment-offsets.index",
        permission: ["read-installment-offset", "view-all-installment-offset", "view-own-installment-offset"],
      },
    ],
  },
  {
    key: "reports",
    labelKey: "nav.reports",
    icon: BarChart3,
    items: [
      {
        labelKey: "nav.reportsPage",
        icon: ReceiptText,
        route: "reports.index",
        permission: "report",
      },
    ],
  },
  {
    key: "users",
    labelKey: "nav.usersManagement",
    icon: Users,
    items: [
      {
        labelKey: "nav.users",
        icon: Users,
        route: "users.index",
        permission: ["view-all-user", "view-own-user"],
      },
      {
        labelKey: "nav.roles",
        icon: ShieldCheck,
        route: "roles.index",
        permission: ["view-all-role", "view-own-role"],
      },
    ],
  },
  {
    key: "settings",
    labelKey: "nav.settings",
    icon: Settings,
    items: [
      {
        labelKey: "nav.systemSettings",
        icon: Settings,
        route: "settings.index",
        permission: "update-setting",
      },
    ],
  },
];

const visibleNavGroups = computed(() =>
  navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          can(item.permission) &&
          (!item.permissionAll ||
            item.permissionAll.every((permission) => can(permission))),
      ),
    }))
    .filter((group) => group.items.length > 0),
);

function toggleGroup(key: NavGroup["key"]) {
  openGroups.value[key] = !openGroups.value[key];
}

function isItemActive(item: NavItem) {
  if (item.route) {
    if (item.route === "stocks.transfer") return route.name === item.route;
    if (item.route === "stocks.index" && route.name === "stocks.transfer")
      return false;
    const resource = item.route.split(".")[0];
    return (
      typeof route.name === "string" && route.name.startsWith(`${resource}.`)
    );
  }

  return (
    route.name === "module-placeholder" && route.params.module === item.module
  );
}

function isGroupActive(group: NavGroup) {
  return group.items.some(isItemActive);
}

function isGroupOpen(group: NavGroup) {
  return openGroups.value[group.key] || isGroupActive(group);
}

async function handleLogout() {
  await auth.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen bg-background text-text">
    <CurrentBranchDialog />
    <button
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-text/40 backdrop-blur-sm lg:hidden"
      type="button"
      :aria-label="t('common.closeSidebar')"
      @click="sidebarOpen = false"
    ></button>

    <aside
      data-testid="app-sidebar"
      class="nav-shell fixed inset-y-0 z-40 w-[19rem] border-white/10 text-white shadow-elevated transition duration-300 ease-out lg:translate-x-0"
      :class="[
        isRtl ? 'right-0 border-l' : 'left-0 border-r',
        sidebarOpen
          ? 'translate-x-0'
          : isRtl
            ? 'translate-x-full'
            : '-translate-x-full',
      ]"
    >
      <div class="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div
          class="rounded-[var(--radius-md)] bg-secondary p-2.5 text-secondary-contrast shadow-lg shadow-secondary/20"
        >
          <Package2 class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold tracking-wide">
            {{ t("app.name") }}
          </p>
          <p class="truncate text-xs text-white/55">{{ t("app.tagline") }}</p>
        </div>
        <button
          class="rounded-[var(--radius-sm)] p-2 text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
          type="button"
          :aria-label="t('common.closeSidebar')"
          @click="sidebarOpen = false"
        >
          <X class="size-4" />
        </button>
      </div>

      <nav
        data-testid="sidebar-nav"
        class="sidebar-scroll h-[calc(100vh-5rem)] space-y-4 overflow-y-auto overflow-x-hidden px-3 py-5"
      >
        <div class="space-y-2">
          <RouterLink
            v-if="canAccessDashboard"
            :to="{ name: 'dashboard' }"
            class="nav-item py-3 font-semibold"
            active-class="nav-item-active"
            @click="sidebarOpen = false"
          >
            <PanelsTopLeft class="nav-icon-accent size-4" />
            <span>{{ t("nav.dashboard") }}</span>
          </RouterLink>
          <RouterLink
            v-if="canAccessQuickSale"
            :to="{ name: 'orders.quick-sale' }"
            class="nav-item py-3 font-semibold"
            active-class="nav-item-active"
            @click="sidebarOpen = false"
          >
            <ShoppingCart class="nav-icon-accent size-4" />
            <span>{{ t("sales.quickSaleTitle") }}</span>
          </RouterLink>
        </div>
        <section
          v-for="group in visibleNavGroups"
          :key="group.key"
          class="space-y-2"
        >
          <button
            :data-testid="`sidebar-group-${group.key}`"
            class="nav-group-button"
            :class="isGroupActive(group) ? 'bg-white/10 text-white' : ''"
            type="button"
            :aria-expanded="isGroupOpen(group)"
            @click="toggleGroup(group.key)"
          >
            <component :is="group.icon" class="nav-icon-accent size-4" />
            <span>{{ t(group.labelKey) }}</span>
            <ChevronDown
              class="size-3 text-white/40 transition duration-300"
              :class="[
                isRtl ? 'mr-auto' : 'ml-auto',
                isGroupOpen(group) ? 'rotate-180' : '',
              ]"
            />
          </button>
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="max-h-0 opacity-0 -translate-y-1"
            enter-to-class="max-h-96 opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="max-h-96 opacity-100 translate-y-0"
            leave-to-class="max-h-0 opacity-0 -translate-y-1"
          >
            <div v-show="isGroupOpen(group)" class="space-y-1 overflow-hidden">
              <RouterLink
                v-for="item in group.items"
                :key="item.route ?? item.module"
                :to="
                  item.route
                    ? { name: item.route }
                    : {
                        name: 'module-placeholder',
                        params: { module: item.module },
                      }
                "
                :data-testid="`sidebar-item-${item.route ?? item.module}`"
                class="nav-item group"
                :class="isItemActive(item) ? 'nav-item-active' : ''"
                active-class="nav-item-active"
                @click="sidebarOpen = false"
              >
                <component
                  :is="item.icon"
                  class="size-4 text-white/35 transition group-hover:text-secondary-soft"
                />
                <span>{{ t(item.labelKey) }}</span>
              </RouterLink>
            </div>
          </Transition>
        </section>
      </nav>
    </aside>

    <div :class="isRtl ? 'lg:pr-[19rem]' : 'lg:pl-[19rem]'">
      <header
        class="sticky top-0 z-30 border-b border-border bg-surface/90 shadow-sm backdrop-blur-xl"
      >
        <div
          class="flex h-[4.5rem] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8"
        >
          <BaseButton
            class="px-3 lg:hidden"
            variant="secondary"
            type="button"
            :aria-label="t('common.openSidebar')"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Menu class="size-5" />
          </BaseButton>
          <div
            class="hidden flex-1 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-background/80 px-4 py-2.5 shadow-inner md:flex"
          >
            <Search class="size-4 text-text-muted" />
            <span class="text-sm text-text-muted">{{
              t("app.searchHint")
            }}</span>
          </div>
          <LanguageSwitcher
            :class="isRtl ? 'mr-auto sm:mr-0' : 'ml-auto sm:ml-0'"
          />
          <BaseButton
            v-if="auth.canReadBranches && auth.canSetCurrentBranch"
            class="hidden max-w-52 sm:inline-flex"
            variant="outline"
            type="button"
            data-testid="open-current-branch-dialog"
            @click="auth.openBranchPrompt"
          >
            <GitBranch class="size-4 shrink-0" />
            <span class="truncate">{{
              auth.currentBranch?.name ?? t("inventory.selectCurrentBranch")
            }}</span>
          </BaseButton>
          <div class="hidden text-end sm:block">
            <p class="text-sm font-semibold text-text">
              {{ auth.user?.name ?? t("common.user") }}
            </p>
            <p class="text-xs text-text-muted">{{ auth.user?.email }}</p>
          </div>
          <BaseButton variant="secondary" type="button" @click="handleLogout">{{
            t("actions.logout")
          }}</BaseButton>
        </div>
      </header>

      <main
        data-testid="app-main"
        class="overflow-x-hidden px-4 py-7 sm:px-6 lg:px-8"
      >
        <RouterView v-slot="{ Component }">
          <KeepAlive include="QuickSalePage" :max="3">
            <component :is="Component" :key="route.fullPath" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.55);
}
</style>

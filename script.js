"use strict";

const SUPABASE_URL = "https://hpvmbotctlhqbtaaafeq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SZQfWm3lEBNSeg0VyL0azA_U_Vta7NZ";
const SESSION_KEY = "stockroom-supabase-session-v1";
const THEME_KEY = "stockroom-theme-v1";
const DEFAULT_SETTINGS = {
  shop_name: "Meri Dukaan",
  default_low_stock_threshold: 5,
  expiry_warning_days: 7,
  currency_code: "INR",
  inventory_initialized: false,
};

const state = {
  session: null,
  settings: { ...DEFAULT_SETTINGS },
  products: [],
  customers: [],
  view: "dashboard",
  dashboardTab: "inventory",
  filter: "all",
  search: "",
  customerSearch: "",
  khataTransaction: null,
  busy: false,
  confirmAction: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const elements = {
  authView: $("#auth-view"),
  appView: $("#app-view"),
  authActions: $("#auth-actions"),
  addProductLink: $("#add-product-link"),
  sidebarToggle: $("#sidebar-toggle"),
  sidebarScrim: $("#sidebar-scrim"),
  shopStatus: $("#shop-status"),
  shopNameLabel: $("#shop-name-label"),
  dateChip: $("#date-chip"),
  todayLabel: $("#today-label"),
  themeToggle: $("#theme-toggle"),
  themeToggleIcon: $("#theme-toggle-icon"),
  logoutButton: $("#logout-button"),
  authMessage: $("#auth-message"),
  appMessage: $("#app-message"),
  loginForm: $("#login-form"),
  signupForm: $("#signup-form"),
  loginTab: $("#login-tab"),
  signupTab: $("#signup-tab"),
  loginPanel: $("#login-panel"),
  signupPanel: $("#signup-panel"),
  authTitle: $("#auth-title"),
  authEyebrow: $("#auth-eyebrow"),
  authSubtitle: $("#auth-subtitle"),
  productDialog: $("#product-dialog"),
  productForm: $("#product-form"),
  productFormError: $("#product-form-error"),
  jsonImportDialog: $("#json-import-dialog"),
  jsonImportForm: $("#json-import-form"),
  jsonImportInput: $("#stock-json-input"),
  jsonFileInput: $("#stock-json-file"),
  jsonImportFeedback: $("#json-import-feedback"),
  jsonImportButton: $("#submit-json-import"),
  manualListDialog: $("#manual-list-dialog"),
  manualListForm: $("#manual-list-form"),
  manualStockInput: $("#manual-stock-input"),
  manualListFeedback: $("#manual-list-feedback"),
  manualListButton: $("#submit-manual-list"),
  dataActionDialog: $("#data-action-dialog"),
  dataActionTitle: $("#data-action-title"),
  dataActionDescription: $("#data-action-description"),
  confirmDataAction: $("#confirm-data-action"),
  globalSearch: $("#global-search"),
  productSearch: $("#product-search"),
  dashboardDate: $("#dashboard-date"),
  dashboardTitle: $("#dashboard-title"),
  inventoryDashboardPanel: $("#inventory-dashboard-panel"),
  khataPanel: $("#khata-panel"),
  customerForm: $("#customer-form"),
  customerFormTitle: $("#customer-form-title"),
  customerId: $("#customer-id"),
  customerName: $("#customer-name"),
  customerPhone: $("#customer-phone"),
  customerOpeningBalance: $("#customer-opening-balance"),
  openingBalanceField: $("#opening-balance-field"),
  customerFormFeedback: $("#customer-form-feedback"),
  saveCustomerButton: $("#save-customer-button"),
  cancelCustomerEdit: $("#cancel-customer-edit"),
  customerSearch: $("#customer-search"),
  customerList: $("#customer-list"),
  customerEmptyState: $("#customer-empty-state"),
  customerEmptyTitle: $("#customer-empty-title"),
  customerEmptyCopy: $("#customer-empty-copy"),
  khataTotalBalance: $("#khata-total-balance"),
  khataCustomerCount: $("#khata-customer-count"),
  khataFeedback: $("#khata-feedback"),
  khataTransactionDialog: $("#khata-transaction-dialog"),
  khataTransactionForm: $("#khata-transaction-form"),
  khataTransactionTitle: $("#khata-transaction-title"),
  transactionCustomerName: $("#transaction-customer-name"),
  transactionAmountLabel: $("#transaction-amount-label"),
  transactionAmount: $("#transaction-amount"),
  transactionFormError: $("#transaction-form-error"),
  saveKhataTransaction: $("#save-khata-transaction"),
  totalProducts: $("#total-products"),
  lowStockCount: $("#low-stock-count"),
  expirySoonCount: $("#expiry-soon-count"),
  expiredCount: $("#expired-count"),
  expirySummaryFoot: $("#expiry-summary-foot"),
  dashboardAlertList: $("#dashboard-alert-list"),
  allAlertsList: $("#all-alerts-list"),
  dashboardTable: $("#dashboard-products-table"),
  productsTable: $("#products-table"),
  dashboardTableWrap: $("#dashboard-table-wrap"),
  dashboardEmptyState: $("#dashboard-empty-state"),
  productsTableWrap: $("#products-table-wrap"),
  productsEmptyState: $("#products-empty-state"),
  productsEmptyTitle: $("#products-empty-title"),
  productsEmptyCopy: $("#products-empty-copy"),
  productsListCount: $("#products-list-count"),
  settingsShopNameInput: $("#settings-shop-name-input"),
  defaultLowStockThreshold: $("#default-low-stock-threshold"),
  profileName: $("#profile-name"),
  profileOwnerNameInput: $("#profile-owner-name"),
  profileAvatar: $("#profile-avatar"),
  profileShopNameInput: $("#profile-shop-name"),
  profileEmailInput: $("#profile-email"),
  profileForm: $("#profile-form"),
  profileFeedback: $("#profile-feedback"),
  saveProfileButton: $("#save-profile-button"),
  shopDetailsFeedback: $("#shop-details-feedback"),
  stockAlertsFeedback: $("#stock-alerts-feedback"),
  expiryRemindersFeedback: $("#expiry-reminders-feedback"),
  dataManagementFeedback: $("#data-management-feedback"),
};

const sampleProductTemplates = [
  {
    name: "Amul Taaza Milk",
    quantity: 3,
    unit: "packets",
    days: 2,
    threshold: 5,
  },
  { name: "Aashirvaad Atta", quantity: 2, unit: "kg", days: 65, threshold: 5 },
  { name: "Tata Salt", quantity: 12, unit: "packets", days: 280, threshold: 5 },
  {
    name: "Parle-G Biscuits",
    quantity: 8,
    unit: "packets",
    days: 5,
    threshold: 4,
  },
  {
    name: "Fortune Sunflower Oil",
    quantity: 6,
    unit: "litres",
    days: -3,
    threshold: 3,
  },
  {
    name: "Maggi Noodles",
    quantity: 20,
    unit: "packets",
    days: 160,
    threshold: 6,
  },
];

function setMessage(element, message = "", type = "") {
  element.textContent = message;
  element.classList.toggle("error", type === "error");
  element.classList.toggle("success", type === "success");
}

function setButtonBusy(button, busy, busyText = "Please wait…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent.trim();
    button.disabled = true;
    const text = $("span", button);
    if (text) text.textContent = busyText;
    else button.textContent = busyText;
    return;
  }
  button.disabled = false;
  const original = button.dataset.originalText;
  if (original) {
    const text = $("span", button);
    if (text) text.textContent = original;
    else button.textContent = original;
    delete button.dataset.originalText;
  }
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Could not read the saved Supabase session.", error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session) {
  state.session = session;
  if (session?.access_token && session?.user?.id) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const dark = theme === "dark";
  elements.themeToggle.setAttribute("aria-pressed", String(dark));
  elements.themeToggle.setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode",
  );
  elements.themeToggle.title = dark
    ? "Switch to light mode"
    : "Switch to dark mode";
  elements.themeToggleIcon.textContent = "◐";
}

function supabaseHeaders(accessToken = state.session?.access_token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function supabaseRequest(
  path,
  options = {},
  accessToken = state.session?.access_token,
) {
  let response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      headers: { ...supabaseHeaders(accessToken), ...(options.headers || {}) },
    });
  } catch (error) {
    throw new Error(
      "Could not reach Supabase. Check your internet connection and try again.",
    );
  }

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }
  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      raw;
    throw new Error(message || `Supabase request failed (${response.status}).`);
  }
  return payload;
}

function authErrorMessage(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  if (/invalid login credentials/i.test(message))
    return "Email or password is incorrect.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email before logging in.";
  if (/user already registered/i.test(message))
    return "An account with this email already exists. Please log in.";
  if (/password should be at least/i.test(message))
    return "Use a password with at least 8 characters.";
  return message;
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function dateDifference(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  const expiry = Date.UTC(year, month - 1, day);
  const todayDate = new Date();
  const today = Date.UTC(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );
  return Math.round((expiry - today) / 86400000);
}

function isValidDateOnly(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function escapedQuery(value) {
  return encodeURIComponent(value);
}

function makeProductId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `product-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeProduct(product) {
  const quantity = Number(product.quantity);
  const threshold = product.low_stock_threshold;
  return {
    id: String(product.id),
    name: String(product.name || "").trim(),
    quantity: Number.isInteger(quantity) && quantity >= 0 ? quantity : 0,
    unit: String(product.unit || "").trim(),
    expiry_date: String(product.expiry_date || product.expiryDate || ""),
    low_stock_threshold:
      threshold === null || threshold === undefined || threshold === ""
        ? null
        : Number(threshold),
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString(),
  };
}

function normalizeCustomer(customer) {
  const balance = Number(customer.balance);
  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error(
      `Customer ${customer.name || customer.id} has an invalid balance in Supabase.`,
    );
  }
  return {
    id: String(customer.id),
    name: String(customer.name || "").trim(),
    phone: String(customer.phone || "").trim(),
    balance: Math.round(balance * 100) / 100,
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: customer.updated_at || new Date().toISOString(),
  };
}

function normalizePhoneNumber(value) {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0"))
    digits = `91${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function productThreshold(product) {
  return (
    product.low_stock_threshold ??
    Number(state.settings.default_low_stock_threshold)
  );
}

function isLowStock(product) {
  return product.quantity <= productThreshold(product);
}

function isExpired(product) {
  const days = dateDifference(product.expiry_date);
  return days !== null && days < 0;
}

function isExpiringSoon(product) {
  const days = dateDifference(product.expiry_date);
  return (
    days !== null &&
    days >= 0 &&
    days <= Number(state.settings.expiry_warning_days)
  );
}

function productStatuses(product) {
  const statuses = [];
  if (isExpired(product))
    statuses.push({ label: "Expired", className: "expired" });
  else if (isExpiringSoon(product))
    statuses.push({ label: "Expiry Soon", className: "soon" });
  if (isLowStock(product))
    statuses.push({ label: "Low Stock", className: "low" });
  if (!statuses.length) statuses.push({ label: "In stock", className: "" });
  return statuses;
}

function matchesFilter(product, filter = state.filter) {
  if (filter === "low") return isLowStock(product);
  if (filter === "soon") return isExpiringSoon(product);
  if (filter === "expired") return isExpired(product);
  return true;
}

function filteredProducts() {
  const term = state.search.trim().toLocaleLowerCase();
  return state.products
    .filter((product) => matchesFilter(product))
    .filter(
      (product) =>
        !term ||
        product.name.toLocaleLowerCase().includes(term) ||
        product.unit.toLocaleLowerCase().includes(term),
    );
}

function makeElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function makeIconButton(action, product, label, icon, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-action ${className}`.trim();
  button.dataset.action = action;
  button.dataset.productId = product.id;
  button.setAttribute("aria-label", `${label} ${product.name}`);
  button.title = `${label} ${product.name}`;
  button.innerHTML = icon;
  return button;
}

function statusBadge(status) {
  const badge = makeElement(
    "span",
    `status-badge ${status.className}`.trim(),
    status.label,
  );
  return badge;
}

function renderProductRow(product) {
  const row = document.createElement("tr");
  const nameCell = makeElement("td", "product-name-cell");
  nameCell.append(makeElement("strong", "", product.name));
  nameCell.append(makeElement("small", "", `Unit: ${product.unit}`));

  const quantityCell = makeElement("td", "quantity-cell");
  const controls = makeElement("span", "quantity-controls");
  const minus = makeElement("button", "qty-action", "−");
  minus.type = "button";
  minus.dataset.action = "decrement";
  minus.dataset.productId = product.id;
  minus.disabled = product.quantity <= 0;
  minus.setAttribute("aria-label", `Decrease ${product.name} quantity`);
  const count = document.createElement("strong");
  count.textContent = String(product.quantity);
  const unit = makeElement("span", "quantity-unit", ` ${product.unit}`);
  const plus = makeElement("button", "qty-action", "+");
  plus.type = "button";
  plus.dataset.action = "increment";
  plus.dataset.productId = product.id;
  plus.setAttribute("aria-label", `Increase ${product.name} quantity`);
  controls.append(minus, count, unit, plus);
  quantityCell.append(controls);

  const expiryCell = makeElement("td", "date-cell");
  expiryCell.textContent = formatDate(product.expiry_date);
  const days = dateDifference(product.expiry_date);
  const daysLabel =
    days === null
      ? ""
      : days < 0
        ? `${Math.abs(days)}d overdue`
        : days === 0
          ? "Expires today"
          : `${days}d left`;
  if (daysLabel)
    expiryCell.append(makeElement("small", "date-hint", daysLabel));

  const statusCell = document.createElement("td");
  const badges = makeElement("span", "status-badges");
  productStatuses(product).forEach((status) =>
    badges.append(statusBadge(status)),
  );
  statusCell.append(badges);

  const actionCell = document.createElement("td");
  const actions = makeElement("span", "row-actions");
  actions.append(
    makeIconButton(
      "edit",
      product,
      "Edit",
      '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="m12.8 4.2 3 3M4 16l3.2-.6L16 6.6a1.8 1.8 0 0 0-2.6-2.6l-8.8 8.8L4 16Z" /></svg>',
    ),
    makeIconButton(
      "delete",
      product,
      "Delete",
      '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4.5 6h11M8 6V4h4v2m2.5 0-.7 10H6.2L5.5 6M8.5 9v4M11.5 9v4" /></svg>',
      "delete",
    ),
  );
  actionCell.append(actions);
  row.append(nameCell, quantityCell, expiryCell, statusCell, actionCell);
  return row;
}

function renderTable(
  table,
  products,
  emptyElement,
  wrapper,
  isDashboard = false,
) {
  table.replaceChildren();
  const visible = isDashboard ? products.slice(0, 6) : products;
  visible.forEach((product) => table.append(renderProductRow(product)));
  const noProducts = state.products.length === 0;
  const noResults = state.products.length > 0 && products.length === 0;
  wrapper.classList.toggle("hidden", noProducts || noResults);
  emptyElement.classList.toggle("hidden", !(noProducts || noResults));
  const title = isDashboard
    ? $("h3", emptyElement)
    : elements.productsEmptyTitle;
  const copy = isDashboard ? $("p", emptyElement) : elements.productsEmptyCopy;
  const emptyButton = $("button", emptyElement);
  if (noResults) {
    title.textContent = "No matching products";
    copy.textContent = "Try another search or filter, or reset your filters.";
    emptyButton.textContent = "Reset filters";
    emptyButton.removeAttribute("data-add-product");
    emptyButton.dataset.emptyReset = "true";
  } else {
    title.textContent = "No products yet";
    copy.textContent =
      "Add your first product to start keeping track of your stock.";
    emptyButton.textContent = "Add your first product";
    emptyButton.dataset.addProduct = "";
    delete emptyButton.dataset.emptyReset;
  }
}

function getAlerts() {
  const alerts = [];
  for (const product of state.products) {
    if (isExpired(product)) {
      alerts.push({
        product,
        label: "Expired",
        detail: `Expired ${Math.abs(dateDifference(product.expiry_date))} days ago · ${formatDate(product.expiry_date)}`,
        kind: "expired",
        priority: 0,
      });
    } else if (isExpiringSoon(product)) {
      const days = dateDifference(product.expiry_date);
      alerts.push({
        product,
        label: "Expiry Soon",
        detail:
          days === 0
            ? "Expires today"
            : `Expires in ${days} day${days === 1 ? "" : "s"} · ${formatDate(product.expiry_date)}`,
        kind: "soon",
        priority: 1,
      });
    }
    if (isLowStock(product)) {
      alerts.push({
        product,
        label: "Low Stock",
        detail: `Only ${product.quantity} ${product.unit} left · threshold ${productThreshold(product)}`,
        kind: "low",
        priority: 2,
      });
    }
  }
  return alerts.sort(
    (a, b) =>
      a.priority - b.priority || a.product.name.localeCompare(b.product.name),
  );
}

function renderAlertItem(alert) {
  const item = makeElement(
    "div",
    `alert-item ${alert.kind === "expired" ? "expired" : alert.kind === "low" ? "danger" : ""}`.trim(),
  );
  item.append(makeElement("span", "alert-indicator"));
  const copy = makeElement("div", "alert-copy");
  copy.append(
    makeElement("strong", "", alert.product.name),
    makeElement("span", "", alert.detail),
  );
  item.append(copy, makeElement("span", "alert-badge", alert.label));
  return item;
}

function renderAlerts() {
  const alerts = getAlerts();
  const list = (container, entries, limit = Infinity) => {
    container.replaceChildren();
    if (!entries.length) {
      const clear = makeElement("div", "all-clear");
      clear.append(
        makeElement("strong", "", "All clear"),
        makeElement("span", "", "No low-stock or expiry alerts right now."),
      );
      container.append(clear);
      return;
    }
    entries
      .slice(0, limit)
      .forEach((alert) => container.append(renderAlertItem(alert)));
  };
  list(elements.dashboardAlertList, alerts, 5);
  list(elements.allAlertsList, alerts);
  $("#sidebar-alert-count").textContent = String(alerts.length);
  $("#sidebar-alert-count").classList.toggle("hidden", alerts.length === 0);
}

function customerWhatsAppUrl(customer) {
  const phone = normalizePhoneNumber(customer.phone);
  if (!phone) return null;
  const message = `Namaste ${customer.name}, ${state.settings.shop_name} ke khate mein aapka ${formatCurrency(customer.balance)} baki hai. Suvidha se chukta kar dein. Dhanyavaad!`;
  return `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`;
}

function makeCustomerAction(action, customer, label, className = "") {
  const button = makeElement("button", className, label);
  button.type = "button";
  button.dataset.khataAction = action;
  button.dataset.customerId = customer.id;
  return button;
}

function renderCustomerCard(customer) {
  const card = makeElement("article", "customer-card");
  const top = makeElement("div", "customer-card-top");
  const identity = makeElement("div", "customer-ident");
  identity.append(
    makeElement("strong", "", customer.name),
    makeElement("span", "customer-phone", customer.phone),
  );
  const balance = makeElement("div", "customer-balance");
  balance.append(
    makeElement("span", "", "Pending udhaar"),
    makeElement(
      "strong",
      customer.balance === 0 ? "settled" : "",
      formatCurrency(customer.balance),
    ),
  );
  top.append(identity, balance);

  const actions = makeElement("div", "customer-card-actions");
  actions.append(
    makeCustomerAction("add", customer, "+ Add Udhaar"),
    makeCustomerAction("settle", customer, "Chukta / Paid"),
    makeCustomerAction("edit", customer, "Edit"),
  );
  const reminderUrl = customerWhatsAppUrl(customer);
  const reminder = document.createElement("a");
  reminder.className = "whatsapp-button";
  reminder.textContent = "WhatsApp reminder";
  if (reminderUrl && customer.balance > 0) {
    reminder.href = reminderUrl;
    reminder.target = "_blank";
    reminder.rel = "noopener noreferrer";
  } else {
    reminder.setAttribute("aria-disabled", "true");
    reminder.title = "No pending balance to remind about";
  }
  actions.append(reminder);
  actions.append(
    makeCustomerAction("delete", customer, "Delete", "customer-delete"),
  );
  const settleButton = $('[data-khata-action="settle"]', actions);
  settleButton.disabled = customer.balance <= 0;
  card.append(top, actions);
  return card;
}

function renderKhata() {
  const total = state.customers.reduce(
    (sum, customer) => sum + customer.balance,
    0,
  );
  elements.khataTotalBalance.textContent = formatCurrency(total);
  elements.khataCustomerCount.textContent = `${state.customers.length} ${state.customers.length === 1 ? "customer" : "customers"}`;
  const term = state.customerSearch.trim().toLocaleLowerCase();
  const visibleCustomers = state.customers.filter(
    (customer) =>
      !term ||
      customer.name.toLocaleLowerCase().includes(term) ||
      customer.phone.toLocaleLowerCase().includes(term),
  );
  elements.customerList.replaceChildren(
    ...visibleCustomers.map(renderCustomerCard),
  );
  const noCustomers = state.customers.length === 0;
  const noResults = state.customers.length > 0 && visibleCustomers.length === 0;
  elements.customerEmptyState.classList.toggle(
    "hidden",
    !(noCustomers || noResults),
  );
  elements.customerList.classList.toggle("hidden", noCustomers || noResults);
  elements.customerEmptyTitle.textContent = noResults
    ? "No matching customers"
    : "No customers yet";
  elements.customerEmptyCopy.textContent = noResults
    ? "Try another name or phone number."
    : "Add a regular customer to start tracking udhaar.";
  $("#empty-add-customer").classList.toggle("hidden", noResults);
}

function setActiveFilter(filter) {
  state.filter = filter;
  $$("[data-inventory-filter]").forEach((button) => {
    const active = button.dataset.inventoryFilter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderApp();
}

function renderApp() {
  const products = filteredProducts();
  const lowCount = state.products.filter(isLowStock).length;
  const soonCount = state.products.filter(isExpiringSoon).length;
  const expiredCount = state.products.filter(isExpired).length;
  elements.totalProducts.textContent = String(state.products.length);
  elements.lowStockCount.textContent = String(lowCount);
  elements.expirySoonCount.textContent = String(soonCount);
  elements.expiredCount.textContent = String(expiredCount);
  elements.expirySummaryFoot.textContent = `Within the next ${state.settings.expiry_warning_days} days`;
  elements.shopNameLabel.textContent = state.settings.shop_name;
  elements.settingsShopNameInput.value = state.settings.shop_name;
  elements.defaultLowStockThreshold.value = String(
    state.settings.default_low_stock_threshold,
  );
  const userMetadata = state.session?.user?.user_metadata;
  const ownerName = [
    userMetadata?.owner_name,
    userMetadata?.full_name,
    userMetadata?.name,
  ].find((name) => typeof name === "string" && name.trim())?.trim()
    || "Name not provided";
  elements.profileName.textContent = ownerName;
  elements.profileOwnerNameInput.value =
    ownerName === "Name not provided" ? "" : ownerName;
  elements.profileAvatar.textContent =
    ownerName === "Name not provided"
      ? "?"
      : ownerName
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
  elements.profileEmailInput.value =
    state.session?.user?.new_email || state.session?.user?.email || "";
  elements.profileShopNameInput.value = state.settings.shop_name;
  elements.dashboardTitle.textContent = getGreeting();
  elements.todayLabel.textContent = formatToday();
  elements.dashboardDate.textContent = formatToday();
  renderAlerts();
  renderKhata();
  renderTable(
    elements.dashboardTable,
    products,
    elements.dashboardEmptyState,
    elements.dashboardTableWrap,
    true,
  );
  renderTable(
    elements.productsTable,
    products,
    elements.productsEmptyState,
    elements.productsTableWrap,
  );
  elements.productsListCount.textContent = `${products.length} ${products.length === 1 ? "product" : "products"}`;
  const showProductSearch =
    state.view === "products" ||
    (state.view === "dashboard" && state.dashboardTab === "inventory");
  elements.globalSearch.classList.toggle("hidden", !showProductSearch);
  elements.inventoryDashboardPanel.classList.toggle(
    "hidden",
    state.dashboardTab !== "inventory",
  );
  elements.khataPanel.classList.toggle(
    "hidden",
    state.dashboardTab !== "khata",
  );
  $$("[data-dashboard-tab]").forEach((tab) => {
    const active = tab.dataset.dashboardTab === state.dashboardTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  for (const [view, pageId] of Object.entries({
    dashboard: "dashboard-page",
    products: "products-page",
    alerts: "alerts-page",
    profile: "profile-page",
    settings: "settings-page",
  })) {
    $(`#${pageId}`).classList.toggle("hidden", state.view !== view);
  }
  $$(".side-link").forEach((link) => {
    const active = link.dataset.view === state.view;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const selectedExpiry = $(
    `input[name="expiryWarningDays"][value="${state.settings.expiry_warning_days}"]`,
  );
  if (selectedExpiry) selectedExpiry.checked = true;
}

function setView(view) {
  if (
    !["dashboard", "products", "alerts", "profile", "settings"].includes(view)
  )
    return;
  state.view = view;
  elements.appView.classList.remove("sidebar-open");
  elements.sidebarToggle.setAttribute("aria-expanded", "false");
  elements.sidebarToggle.setAttribute("aria-label", "Open navigation menu");
  elements.sidebarScrim.classList.add("hidden");
  renderApp();
}

function setDashboardTab(tab) {
  if (!["inventory", "khata"].includes(tab)) return;
  state.dashboardTab = tab;
  renderApp();
}

function showAuth() {
  elements.authView.classList.remove("hidden");
  elements.appView.classList.add("hidden");
  elements.authActions.classList.remove("hidden");
  elements.addProductLink.classList.add("hidden");
  elements.logoutButton.classList.add("hidden");
  elements.sidebarToggle.classList.add("hidden");
  elements.shopStatus.classList.add("hidden");
  elements.dateChip.classList.remove("hidden");
}

function showApp() {
  elements.authView.classList.add("hidden");
  elements.appView.classList.remove("hidden");
  elements.authActions.classList.add("hidden");
  elements.addProductLink.classList.remove("hidden");
  elements.logoutButton.classList.remove("hidden");
  elements.sidebarToggle.classList.remove("hidden");
  elements.shopStatus.classList.remove("hidden");
  elements.dateChip.classList.add("hidden");
}

async function refreshSessionIfNeeded(session) {
  const expiresAt = Number(session.expires_at || 0);
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;
  if (!session.refresh_token) return null;
  const refreshed = await supabaseRequest(
    "/auth/v1/token?grant_type=refresh_token",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
    SUPABASE_ANON_KEY,
  );
  return {
    ...refreshed,
    expires_at:
      refreshed.expires_at ||
      Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
  };
}

async function authenticate(path, body) {
  const session = await supabaseRequest(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    SUPABASE_ANON_KEY,
  );
  if (session.access_token && session.user) {
    session.expires_at =
      session.expires_at ||
      Math.floor(Date.now() / 1000) + (session.expires_in || 3600);
    saveSession(session);
    await showSignedIn();
    return { signedIn: true, session };
  }
  return { signedIn: false, session };
}

function settingsFromRow(row, user) {
  const metadataShopName = user?.user_metadata?.shop_name;
  return {
    ...DEFAULT_SETTINGS,
    shop_name:
      row?.shop_name ||
      metadataShopName ||
      user?.email?.split("@")[0] ||
      "Meri Dukaan",
    default_low_stock_threshold: Number.isInteger(
      Number(row?.default_low_stock_threshold),
    )
      ? Number(row.default_low_stock_threshold)
      : DEFAULT_SETTINGS.default_low_stock_threshold,
    expiry_warning_days: [3, 7, 14].includes(Number(row?.expiry_warning_days))
      ? Number(row.expiry_warning_days)
      : DEFAULT_SETTINGS.expiry_warning_days,
    currency_code: "INR",
    inventory_initialized: Boolean(row?.inventory_initialized),
  };
}

function readLegacyValue(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `Saved browser data (${key}) could not be read. It has not been removed.`,
    );
  }
}

function getLegacyData(userId) {
  const legacyProducts = readLegacyValue(`stockroom-products-v1:${userId}`);
  const legacySettings = readLegacyValue(`stockroom-settings-v1:${userId}`);
  return {
    products: Array.isArray(legacyProducts)
      ? legacyProducts.map(normalizeProduct)
      : [],
    settings: legacySettings || null,
  };
}

function clearLegacyData(userId) {
  localStorage.removeItem(`stockroom-products-v1:${userId}`);
  localStorage.removeItem(`stockroom-settings-v1:${userId}`);
}

function makeSampleProducts() {
  return sampleProductTemplates.map((template) => ({
    id: makeProductId(),
    name: template.name,
    quantity: template.quantity,
    unit: template.unit,
    expiry_date: dateOffset(template.days),
    low_stock_threshold: template.threshold,
  }));
}

async function fetchShopSettings(userId) {
  const rows = await supabaseRequest(
    `/rest/v1/shop_settings?select=*&owner_id=eq.${escapedQuery(userId)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchProducts(userId) {
  const rows = await supabaseRequest(
    `/rest/v1/products?select=*&owner_id=eq.${escapedQuery(userId)}&order=created_at.desc`,
  );
  if (!Array.isArray(rows))
    throw new Error("Supabase returned an unexpected products response.");
  return rows.map(normalizeProduct);
}

async function fetchCustomers(userId) {
  const rows = await supabaseRequest(
    `/rest/v1/customers?select=*&owner_id=eq.${escapedQuery(userId)}&order=updated_at.desc`,
  );
  if (!Array.isArray(rows))
    throw new Error("Supabase returned an unexpected customers response.");
  return rows.map(normalizeCustomer);
}

async function upsertShopSettings(userId, settings) {
  const row = {
    owner_id: userId,
    shop_name: settings.shop_name,
    default_low_stock_threshold: Number(settings.default_low_stock_threshold),
    expiry_warning_days: Number(settings.expiry_warning_days),
    currency_code: "INR",
    inventory_initialized: Boolean(settings.inventory_initialized),
    updated_at: new Date().toISOString(),
  };
  await supabaseRequest("/rest/v1/shop_settings?on_conflict=owner_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
}

async function patchShopSettings(userId, values) {
  const response = await supabaseRequest(
    `/rest/v1/shop_settings?owner_id=eq.${escapedQuery(userId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
    },
  );
  if (Array.isArray(response) && response.length > 0) return;
  await upsertShopSettings(userId, { ...state.settings, ...values });
}

function productsForRpc(products) {
  return products.map((product) => ({
    id: String(product.id || makeProductId()),
    name: String(product.name).trim(),
    quantity: Number(product.quantity),
    unit: String(product.unit).trim(),
    expiry_date: product.expiry_date || product.expiryDate,
    low_stock_threshold: product.low_stock_threshold ?? null,
  }));
}

async function replaceProductsInSupabase(products) {
  await supabaseRequest("/rest/v1/rpc/replace_my_products", {
    method: "POST",
    body: JSON.stringify({ p_products: productsForRpc(products) }),
  });
}

async function initializeInventory(userId, settingsRow, products) {
  const existing = settingsFromRow(settingsRow, state.session.user);
  const needsInitialization = !settingsRow || !existing.inventory_initialized;
  const legacy = needsInitialization
    ? getLegacyData(userId)
    : { products: [], settings: null };
  let settings = { ...existing };
  if (legacy.settings && !settingsRow) {
    const legacyShopName =
      legacy.settings.shop_name || legacy.settings.shopName;
    const legacyThreshold =
      legacy.settings.default_low_stock_threshold ??
      legacy.settings.defaultLowStockThreshold;
    const legacyDays =
      legacy.settings.expiry_warning_days ?? legacy.settings.expiryWarningDays;
    if (typeof legacyShopName === "string" && legacyShopName.trim())
      settings.shop_name = legacyShopName.trim().slice(0, 80);
    if (
      Number.isInteger(Number(legacyThreshold)) &&
      Number(legacyThreshold) >= 0
    )
      settings.default_low_stock_threshold = Number(legacyThreshold);
    if ([3, 7, 14].includes(Number(legacyDays)))
      settings.expiry_warning_days = Number(legacyDays);
  }

  let finalProducts = products;
  if (needsInitialization && products.length === 0) {
    const toMigrate = legacy.products.length
      ? legacy.products
      : makeSampleProducts();
    if (toMigrate.length) {
      await replaceProductsInSupabase(toMigrate);
      finalProducts = toMigrate.map(normalizeProduct);
    }
  }
  settings.inventory_initialized = true;
  await upsertShopSettings(userId, settings);
  clearLegacyData(userId);
  return { settings, products: finalProducts };
}

async function loadShopData() {
  const userId = state.session.user.id;
  const [settingsRow, products, customers] = await Promise.all([
    fetchShopSettings(userId),
    fetchProducts(userId),
    fetchCustomers(userId),
  ]);
  const data = await initializeInventory(userId, settingsRow, products);
  state.settings = data.settings;
  state.products = data.products;
  state.customers = customers;
}

async function showSignedIn() {
  if (!state.session?.user?.id) return;
  setMessage(elements.authMessage, "");
  showApp();
  setMessage(elements.appMessage, "Loading your shop data…");
  try {
    await loadShopData();
    renderApp();
    setMessage(elements.appMessage, "");
  } catch (error) {
    setMessage(
      elements.appMessage,
      `Could not load your shop data: ${error.message}`,
      "error",
    );
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setMessage(elements.authMessage, "");
  const button = $("button[type='submit']", elements.loginForm);
  setButtonBusy(button, true, "Logging in…");
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  try {
    if (!email || !password) throw new Error("Enter your email and password.");
    await authenticate("/auth/v1/token?grant_type=password", {
      email,
      password,
    });
  } catch (error) {
    setMessage(elements.authMessage, authErrorMessage(error), "error");
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  setMessage(elements.authMessage, "");
  const button = $("button[type='submit']", elements.signupForm);
  setButtonBusy(button, true, "Creating account…");
  const shopName = $("#signup-shop-name").value.trim();
  const ownerName = $("#signup-owner-name").value.trim();
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;
  const confirmPassword = $("#signup-confirm-password").value;
  try {
    if (!ownerName) throw new Error("Enter the owner's name.");
    if (ownerName.length > 80)
      throw new Error("Owner name must be 80 characters or fewer.");
    if (!shopName) throw new Error("Enter your shop name.");
    if (shopName.length > 80)
      throw new Error("Shop name must be 80 characters or fewer.");
    if (!email) throw new Error("Enter your email address.");
    if (password.length < 8)
      throw new Error("Use a password with at least 8 characters.");
    if (password !== confirmPassword)
      throw new Error("The passwords do not match.");
    const result = await authenticate("/auth/v1/signup", {
      email,
      password,
      data: { owner_name: ownerName, shop_name: shopName },
    });
    if (!result.signedIn) {
      setMessage(
        elements.authMessage,
        "Account created. Confirm your email, then log in to continue.",
        "success",
      );
      elements.loginTab.click();
      $("#login-email").value = email;
    }
  } catch (error) {
    setMessage(elements.authMessage, authErrorMessage(error), "error");
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleLogout() {
  const session = state.session;
  saveSession(null);
  state.products = [];
  state.customers = [];
  state.settings = { ...DEFAULT_SETTINGS };
  state.view = "dashboard";
  state.dashboardTab = "inventory";
  state.filter = "all";
  state.search = "";
  state.customerSearch = "";
  elements.productSearch.value = "";
  showAuth();
  renderApp();
  if (!session?.access_token) return;
  try {
    await supabaseRequest(
      "/auth/v1/logout",
      { method: "POST" },
      session.access_token,
    );
  } catch (error) {
    console.warn(
      "Supabase logout endpoint could not be reached after clearing the local session.",
      error,
    );
  }
}

function switchAuthTab(tab) {
  const signUp = tab === "signup";
  elements.signupTab.classList.toggle("active", signUp);
  elements.loginTab.classList.toggle("active", !signUp);
  elements.signupTab.setAttribute("aria-selected", String(signUp));
  elements.loginTab.setAttribute("aria-selected", String(!signUp));
  elements.signupPanel.classList.toggle("hidden", !signUp);
  elements.loginPanel.classList.toggle("hidden", signUp);
  elements.authTitle.textContent = signUp
    ? "Create your owner account"
    : "Log in to Stockroom";
  elements.authEyebrow.textContent = signUp
    ? "SHOP OWNER SETUP"
    : "WELCOME BACK";
  elements.authSubtitle.textContent = signUp
    ? "Set up an account to manage your shop inventory."
    : "Use your shop owner account to continue.";
  setMessage(elements.authMessage, "");
}

function openProductDialog(product = null) {
  elements.productForm.reset();
  elements.productFormError.textContent = "";
  $("#product-id").value = product?.id || "";
  $("#product-name").value = product?.name || "";
  $("#product-quantity").value = product ? String(product.quantity) : "";
  $("#product-unit").value = product?.unit || "";
  $("#product-expiry").value = product?.expiry_date || "";
  $("#product-threshold").value = product?.low_stock_threshold ?? "";
  $("#product-dialog-title").textContent = product
    ? "Edit product"
    : "Add a product";
  $("#save-product-button span").textContent = product
    ? "Save changes"
    : "Add product";
  elements.productDialog.showModal();
  $("#product-name").focus();
}

function closeProductDialog() {
  elements.productDialog.close();
}

function validateProductForm() {
  const name = $("#product-name").value.trim();
  const quantityValue = $("#product-quantity").value;
  const quantity = Number(quantityValue);
  const unit = $("#product-unit").value.trim();
  const expiryDate = $("#product-expiry").value;
  const thresholdValue = $("#product-threshold").value;
  const threshold = thresholdValue === "" ? null : Number(thresholdValue);
  if (!name) return { error: "Enter a product name." };
  if (name.length > 80)
    return { error: "Product name must be 80 characters or fewer." };
  if (quantityValue === "" || !Number.isInteger(quantity) || quantity < 0)
    return { error: "Quantity must be a whole number of 0 or more." };
  if (!unit) return { error: "Enter a unit, such as kg or packets." };
  if (unit.length > 20)
    return { error: "Unit must be 20 characters or fewer." };
  if (!isValidDateOnly(expiryDate))
    return { error: "Enter a real expiry date in YYYY-MM-DD format." };
  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0))
    return {
      error: "Low-stock threshold must be a whole number of 0 or more.",
    };
  return {
    product: {
      name,
      quantity,
      unit,
      expiry_date: expiryDate,
      low_stock_threshold: threshold,
    },
  };
}

async function saveProduct(event) {
  event.preventDefault();
  elements.productFormError.textContent = "";
  const validation = validateProductForm();
  if (validation.error) {
    elements.productFormError.textContent = validation.error;
    return;
  }
  const id = $("#product-id").value;
  const product = validation.product;
  const button = $("#save-product-button");
  setButtonBusy(button, true, id ? "Saving…" : "Adding…");
  try {
    if (id) {
      await supabaseRequest(
        `/rest/v1/products?owner_id=eq.${escapedQuery(state.session.user.id)}&id=eq.${escapedQuery(id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            ...product,
            updated_at: new Date().toISOString(),
          }),
        },
      );
    } else {
      await supabaseRequest("/rest/v1/products", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          ...product,
          id: makeProductId(),
          owner_id: state.session.user.id,
        }),
      });
    }
    closeProductDialog();
    await loadShopData();
    renderApp();
    setMessage(
      elements.appMessage,
      id ? "Product updated." : "Product added.",
      "success",
    );
  } catch (error) {
    elements.productFormError.textContent = `Could not save product: ${error.message}`;
  } finally {
    setButtonBusy(button, false);
  }
}

function prepareBulkProducts(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("Provide at least one product.");
  }
  if (entries.length > 500) {
    throw new Error("Import up to 500 products at a time.");
  }

  const inventory = state.products.map((product) => ({ ...product }));
  const touchedIds = new Set();
  const imported = [];
  let added = 0;
  let updated = 0;

  entries.forEach((entry, index) => {
    const rowNumber = entry?._sourceLine || index + 1;
    const invalid = (message) => {
      throw new Error(`Row ${rowNumber}: ${message}`);
    };
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      invalid("each item must be a product object.");
    }

    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name || name.length > 80)
      invalid("enter a product name up to 80 characters.");
    if (
      entry.quantity === undefined ||
      entry.quantity === null ||
      entry.quantity === ""
    ) {
      invalid("quantity is required.");
    }
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      invalid("quantity must be a whole number of 0 or more.");
    }

    const rawUnit =
      entry.unit === undefined || entry.unit === null
        ? ""
        : String(entry.unit).trim();
    if (rawUnit.length > 20) invalid("unit must be 20 characters or fewer.");
    const rawExpiry = entry.expiry_date ?? entry.expiryDate ?? "";
    const expiryDate = String(rawExpiry).trim();
    const hasThreshold =
      Object.prototype.hasOwnProperty.call(entry, "low_stock_threshold") ||
      Object.prototype.hasOwnProperty.call(entry, "lowStockThreshold");
    const rawThreshold = Object.prototype.hasOwnProperty.call(
      entry,
      "low_stock_threshold",
    )
      ? entry.low_stock_threshold
      : entry.lowStockThreshold;
    let threshold = null;
    if (hasThreshold && rawThreshold !== null) {
      if (rawThreshold === "")
        invalid("low-stock threshold must be a whole number or null.");
      threshold = Number(rawThreshold);
      if (!Number.isInteger(threshold) || threshold < 0) {
        invalid("low-stock threshold must be a whole number of 0 or more.");
      }
    }

    const suppliedId =
      entry.id === undefined || entry.id === null
        ? ""
        : String(entry.id).trim();
    let existing = null;
    if (suppliedId) {
      existing = inventory.find((product) => product.id === suppliedId) || null;
    } else {
      let candidates = inventory.filter(
        (product) =>
          product.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      if (rawUnit) {
        candidates = candidates.filter(
          (product) =>
            product.unit.toLocaleLowerCase() === rawUnit.toLocaleLowerCase(),
        );
      }
      if (candidates.length > 1) {
        invalid(
          "more than one product matches this name. Include its id or a unit that identifies it.",
        );
      }
      existing = candidates[0] || null;
    }

    const id = existing?.id || suppliedId || makeProductId();
    if (touchedIds.has(id))
      invalid("the same product appears more than once in this import.");
    touchedIds.add(id);

    const unit = rawUnit || existing?.unit || "";
    const effectiveExpiry = expiryDate || existing?.expiry_date || "";
    if (!unit) invalid("new products need a unit.");
    if (unit.length > 20) invalid("unit must be 20 characters or fewer.");
    if (!isValidDateOnly(effectiveExpiry)) {
      invalid(
        existing
          ? "expiry_date must use YYYY-MM-DD when provided."
          : "new products need a real expiry date in YYYY-MM-DD format.",
      );
    }

    const product = {
      id,
      name,
      quantity,
      unit,
      expiry_date: effectiveExpiry,
      low_stock_threshold: hasThreshold
        ? threshold
        : (existing?.low_stock_threshold ?? null),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const existingIndex = inventory.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      inventory[existingIndex] = product;
      updated += 1;
    } else {
      inventory.push(product);
      added += 1;
    }
    imported.push(product);
  });

  return { products: imported, added, updated };
}

function parseManualStockList(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter((item) => item.line);
  if (lines.length === 0) throw new Error("Enter at least one stock-list row.");
  if (lines.length > 500) throw new Error("Add up to 500 products at a time.");
  return lines.map(({ line, number }) => {
    const fields = line.split("|").map((field) => field.trim());
    if (fields.length < 2 || fields.length > 5) {
      throw new Error(
        `Line ${number}: use Name | Quantity | Unit | Expiry date | Threshold.`,
      );
    }
    const product = {
      name: fields[0],
      quantity: fields[1],
      _sourceLine: number,
    };
    if (fields[2]) product.unit = fields[2];
    if (fields[3]) product.expiry_date = fields[3];
    if (fields[4]) product.low_stock_threshold = fields[4];
    return product;
  });
}

async function importStockProducts(entries, dialog, button, feedback) {
  feedback.textContent = "";
  let batch;
  try {
    batch = prepareBulkProducts(entries);
  } catch (error) {
    feedback.textContent = error.message;
    return;
  }

  setButtonBusy(button, true, "Importing…");
  try {
    await supabaseRequest("/rest/v1/rpc/upsert_my_products", {
      method: "POST",
      body: JSON.stringify({ p_products: productsForRpc(batch.products) }),
    });
    state.products = await fetchProducts(state.session.user.id);
    state.filter = "all";
    state.search = "";
    elements.productSearch.value = "";
    state.view = "products";
    dialog.close();
    renderApp();
    setMessage(
      elements.appMessage,
      `Stock updated: ${batch.added} added, ${batch.updated} updated.`,
      "success",
    );
  } catch (error) {
    feedback.textContent = `Could not update stock: ${error.message}`;
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleJsonStockImport(event) {
  event.preventDefault();
  elements.jsonImportFeedback.textContent = "";
  try {
    const data = JSON.parse(elements.jsonImportInput.value);
    const entries = Array.isArray(data) ? data : data?.products;
    if (!Array.isArray(entries))
      throw new Error(
        "JSON must be a product array or an object with a products array.",
      );
    await importStockProducts(
      entries,
      elements.jsonImportDialog,
      elements.jsonImportButton,
      elements.jsonImportFeedback,
    );
  } catch (error) {
    elements.jsonImportFeedback.textContent =
      error instanceof SyntaxError
        ? "JSON format is invalid. Check commas, quotes, and brackets."
        : error.message;
  }
}

async function handleManualStockImport(event) {
  event.preventDefault();
  elements.manualListFeedback.textContent = "";
  try {
    const entries = parseManualStockList(elements.manualStockInput.value);
    await importStockProducts(
      entries,
      elements.manualListDialog,
      elements.manualListButton,
      elements.manualListFeedback,
    );
  } catch (error) {
    elements.manualListFeedback.textContent = error.message;
  }
}

async function changeProductQuantity(product, amount) {
  const quantity = product.quantity + amount;
  if (quantity < 0) return;
  try {
    await supabaseRequest(
      `/rest/v1/products?owner_id=eq.${escapedQuery(state.session.user.id)}&id=eq.${escapedQuery(product.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          quantity,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    await loadShopData();
    renderApp();
    setMessage(
      elements.appMessage,
      `${product.name} quantity updated.`,
      "success",
    );
  } catch (error) {
    setMessage(
      elements.appMessage,
      `Could not update quantity: ${error.message}`,
      "error",
    );
  }
}

async function deleteProduct(product) {
  if (!window.confirm(`Delete ${product.name} from your inventory?`)) return;
  try {
    await supabaseRequest(
      `/rest/v1/products?owner_id=eq.${escapedQuery(state.session.user.id)}&id=eq.${escapedQuery(product.id)}`,
      {
        method: "DELETE",
      },
    );
    await loadShopData();
    renderApp();
    setMessage(elements.appMessage, `${product.name} was deleted.`, "success");
  } catch (error) {
    setMessage(
      elements.appMessage,
      `Could not delete product: ${error.message}`,
      "error",
    );
  }
}

function handleTableAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const product = state.products.find(
    (item) => item.id === button.dataset.productId,
  );
  if (!product) return;
  const action = button.dataset.action;
  if (action === "edit") openProductDialog(product);
  else if (action === "delete") void deleteProduct(product);
  else if (action === "increment") void changeProductQuantity(product, 1);
  else if (action === "decrement") void changeProductQuantity(product, -1);
}

function resetCustomerForm() {
  elements.customerForm.reset();
  elements.customerId.value = "";
  elements.customerOpeningBalance.value = "0";
  elements.openingBalanceField.classList.remove("hidden");
  elements.customerFormTitle.textContent = "Add regular customer";
  elements.saveCustomerButton.querySelector("span").textContent =
    "Add customer";
  elements.cancelCustomerEdit.classList.add("hidden");
  setMessage(elements.customerFormFeedback, "");
}

function editCustomer(customer) {
  state.view = "dashboard";
  state.dashboardTab = "khata";
  elements.customerId.value = customer.id;
  elements.customerName.value = customer.name;
  elements.customerPhone.value = customer.phone;
  elements.openingBalanceField.classList.add("hidden");
  elements.customerFormTitle.textContent = "Edit customer";
  elements.saveCustomerButton.querySelector("span").textContent =
    "Save customer details";
  elements.cancelCustomerEdit.classList.remove("hidden");
  setMessage(elements.customerFormFeedback, "");
  renderApp();
  elements.customerName.focus();
}

async function saveCustomer(event) {
  event.preventDefault();
  setMessage(elements.customerFormFeedback, "");
  const name = elements.customerName.value.trim();
  const phone = normalizePhoneNumber(elements.customerPhone.value);
  const customerId = elements.customerId.value;
  const openingBalance = Number(elements.customerOpeningBalance.value || 0);
  if (!name || name.length > 80) {
    setMessage(
      elements.customerFormFeedback,
      "Enter a customer name between 1 and 80 characters.",
      "error",
    );
    return;
  }
  if (!phone) {
    setMessage(
      elements.customerFormFeedback,
      "Enter a valid phone number with country code, or a 10-digit Indian number.",
      "error",
    );
    return;
  }
  if (
    !customerId &&
    (!Number.isFinite(openingBalance) ||
      openingBalance < 0 ||
      openingBalance > 9999999999.99)
  ) {
    setMessage(
      elements.customerFormFeedback,
      "Starting udhaar must be between ₹0 and ₹9,999,999,999.99.",
      "error",
    );
    return;
  }
  const button = elements.saveCustomerButton;
  setButtonBusy(button, true, customerId ? "Saving…" : "Adding…");
  try {
    if (customerId) {
      await supabaseRequest(
        `/rest/v1/customers?owner_id=eq.${escapedQuery(state.session.user.id)}&id=eq.${escapedQuery(customerId)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            name,
            phone,
            updated_at: new Date().toISOString(),
          }),
        },
      );
    } else {
      await supabaseRequest("/rest/v1/customers", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          owner_id: state.session.user.id,
          id: makeProductId(),
          name,
          phone,
          balance: Math.round(openingBalance * 100) / 100,
        }),
      });
    }
    await reloadCustomers();
    setButtonBusy(button, false);
    resetCustomerForm();
    renderApp();
    setMessage(
      elements.khataFeedback,
      customerId ? "Customer details updated." : "Customer added to khata.",
      "success",
    );
  } catch (error) {
    setMessage(
      elements.customerFormFeedback,
      `Could not save customer: ${error.message}`,
      "error",
    );
  } finally {
    setButtonBusy(button, false);
  }
}

async function reloadCustomers() {
  state.customers = await fetchCustomers(state.session.user.id);
}

function openKhataTransaction(customer, type) {
  state.khataTransaction = { customerId: customer.id, type };
  const isAdding = type === "add";
  elements.khataTransactionTitle.textContent = isAdding
    ? "Add udhaar"
    : "Record payment";
  elements.transactionCustomerName.textContent = `${customer.name} · Pending ${formatCurrency(customer.balance)}`;
  elements.transactionAmountLabel.textContent = isAdding
    ? "Udhaar amount (₹)"
    : "Payment received (₹)";
  elements.transactionAmount.value = isAdding
    ? ""
    : customer.balance.toFixed(2);
  elements.saveKhataTransaction.querySelector("span").textContent = isAdding
    ? "Add udhaar"
    : "Mark chukta";
  elements.transactionFormError.textContent = "";
  elements.khataTransactionDialog.showModal();
  elements.transactionAmount.focus();
}

function closeKhataTransaction() {
  state.khataTransaction = null;
  elements.khataTransactionDialog.close();
}

async function saveKhataTransaction(event) {
  event.preventDefault();
  elements.transactionFormError.textContent = "";
  const transaction = state.khataTransaction;
  const amount = Number(elements.transactionAmount.value);
  if (
    !transaction ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 9999999999.99
  ) {
    elements.transactionFormError.textContent =
      "Enter an amount greater than ₹0.";
    return;
  }
  const customer = state.customers.find(
    (item) => item.id === transaction.customerId,
  );
  if (!customer) {
    elements.transactionFormError.textContent =
      "This customer is no longer in your khata. Refresh and try again.";
    return;
  }
  if (transaction.type === "settle" && amount > customer.balance) {
    elements.transactionFormError.textContent = `Payment cannot be more than the pending balance of ${formatCurrency(customer.balance)}.`;
    return;
  }
  const button = elements.saveKhataTransaction;
  setButtonBusy(button, true, "Saving…");
  try {
    const functionName =
      transaction.type === "add"
        ? "add_my_customer_udhaar"
        : "settle_my_customer_udhaar";
    await supabaseRequest(`/rest/v1/rpc/${functionName}`, {
      method: "POST",
      body: JSON.stringify({
        p_customer_id: customer.id,
        p_amount: Math.round(amount * 100) / 100,
      }),
    });
    closeKhataTransaction();
    await reloadCustomers();
    renderApp();
    const message =
      transaction.type === "add"
        ? "Udhaar added to the customer khata."
        : "Payment recorded and balance updated.";
    setMessage(elements.khataFeedback, message, "success");
  } catch (error) {
    elements.transactionFormError.textContent = `Could not update khata: ${error.message}`;
  } finally {
    setButtonBusy(button, false);
  }
}

async function deleteCustomer(customer) {
  if (
    !window.confirm(
      `Delete ${customer.name} and their khata balance of ${formatCurrency(customer.balance)}?`,
    )
  )
    return;
  try {
    await supabaseRequest(
      `/rest/v1/customers?owner_id=eq.${escapedQuery(state.session.user.id)}&id=eq.${escapedQuery(customer.id)}`,
      {
        method: "DELETE",
      },
    );
    if (elements.customerId.value === customer.id) resetCustomerForm();
    await reloadCustomers();
    renderApp();
    setMessage(
      elements.khataFeedback,
      `${customer.name} was removed from the khata.`,
      "success",
    );
  } catch (error) {
    setMessage(
      elements.khataFeedback,
      `Could not delete customer: ${error.message}`,
      "error",
    );
  }
}

function handleCustomerAction(event) {
  const button = event.target.closest("[data-khata-action]");
  if (!button || button.disabled) return;
  const customer = state.customers.find(
    (item) => item.id === button.dataset.customerId,
  );
  if (!customer) return;
  const action = button.dataset.khataAction;
  if (action === "add") openKhataTransaction(customer, "add");
  else if (action === "settle") openKhataTransaction(customer, "settle");
  else if (action === "edit") editCustomer(customer);
  else if (action === "delete") void deleteCustomer(customer);
}

function showConfirmDialog({ title, description, confirmLabel, action }) {
  state.confirmAction = action;
  elements.dataActionTitle.textContent = title;
  elements.dataActionDescription.textContent = description;
  elements.confirmDataAction.textContent = confirmLabel;
  elements.dataActionDialog.showModal();
}

function closeConfirmDialog() {
  state.confirmAction = null;
  elements.dataActionDialog.close();
}

async function restoreSampleData() {
  const samples = makeSampleProducts();
  await replaceProductsInSupabase(samples);
  await patchShopSettings(state.session.user.id, {
    inventory_initialized: true,
  });
  await loadShopData();
  renderApp();
  setMessage(
    elements.dataManagementFeedback,
    "Sample products restored.",
    "success",
  );
}

async function clearAllProducts() {
  await replaceProductsInSupabase([]);
  await patchShopSettings(state.session.user.id, {
    inventory_initialized: true,
  });
  await loadShopData();
  renderApp();
  setMessage(
    elements.dataManagementFeedback,
    "All products cleared. Your inventory is now empty.",
    "success",
  );
}

async function runConfirmedAction() {
  const action = state.confirmAction;
  closeConfirmDialog();
  setMessage(elements.dataManagementFeedback, "");
  try {
    if (action === "restore") await restoreSampleData();
    if (action === "clear") await clearAllProducts();
  } catch (error) {
    setMessage(
      elements.dataManagementFeedback,
      `Action failed: ${error.message}`,
      "error",
    );
  }
}

async function saveShopDetails(event) {
  event.preventDefault();
  setMessage(elements.shopDetailsFeedback, "");
  const shopName = elements.settingsShopNameInput.value.trim();
  if (!shopName || shopName.length > 80) {
    setMessage(
      elements.shopDetailsFeedback,
      "Enter a shop name between 1 and 80 characters.",
      "error",
    );
    return;
  }
  try {
    await patchShopSettings(state.session.user.id, { shop_name: shopName });
    state.settings.shop_name = shopName;
    renderApp();
    try {
      const updatedUser = await supabaseRequest("/auth/v1/user", {
        method: "PUT",
        body: JSON.stringify({
          data: {
            ...state.session.user.user_metadata,
            shop_name: shopName,
          },
        }),
      });
      if (updatedUser?.id === state.session.user.id) {
        state.session = { ...state.session, user: updatedUser };
        saveSession(state.session);
      }
    } catch (error) {
      setMessage(
        elements.shopDetailsFeedback,
        `Shop name saved, but the owner profile could not be updated: ${error.message}`,
        "error",
      );
      return;
    }
    setMessage(elements.shopDetailsFeedback, "Shop details saved.", "success");
  } catch (error) {
    setMessage(
      elements.shopDetailsFeedback,
      `Could not save shop details: ${error.message}`,
      "error",
    );
  }
}

async function saveProfile(event) {
  event.preventDefault();
  setMessage(elements.profileFeedback, "");
  const ownerName = elements.profileOwnerNameInput.value.trim();
  const shopName = elements.profileShopNameInput.value.trim();
  const email = elements.profileEmailInput.value.trim();
  const user = state.session?.user;

  if (!user?.id) {
    setMessage(
      elements.profileFeedback,
      "Your session has expired. Log in again to update your profile.",
      "error",
    );
    return;
  }
  if (!ownerName || ownerName.length > 80) {
    setMessage(
      elements.profileFeedback,
      "Enter an owner name between 1 and 80 characters.",
      "error",
    );
    return;
  }
  if (!shopName || shopName.length > 80) {
    setMessage(
      elements.profileFeedback,
      "Enter a shop name between 1 and 80 characters.",
      "error",
    );
    return;
  }
  if (
    !email ||
    email.length > 254 ||
    !elements.profileEmailInput.validity.valid
  ) {
    setMessage(
      elements.profileFeedback,
      "Enter a valid email address.",
      "error",
    );
    return;
  }

  const currentOwnerName =
    user.user_metadata?.owner_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";
  const shopChanged = shopName !== state.settings.shop_name;
  const ownerChanged = ownerName !== currentOwnerName;
  const emailChanged = email.toLowerCase() !== (user.email || "").toLowerCase();
  if (!shopChanged && !ownerChanged && !emailChanged) {
    setMessage(elements.profileFeedback, "No changes to save.", "success");
    return;
  }

  setButtonBusy(elements.saveProfileButton, true, "Saving…");
  let shopSaved = false;
  try {
    if (shopChanged) {
      await patchShopSettings(user.id, { shop_name: shopName });
      state.settings.shop_name = shopName;
      shopSaved = true;
    }

    const updatedUser = await supabaseRequest("/auth/v1/user", {
      method: "PUT",
      body: JSON.stringify({
        ...(emailChanged ? { email } : {}),
        data: {
          ...user.user_metadata,
          owner_name: ownerName,
          shop_name: shopName,
        },
      }),
    });
    if (updatedUser?.id !== user.id) {
      throw new Error("Supabase returned unexpected account details.");
    }
    state.session = { ...state.session, user: updatedUser };
    saveSession(state.session);
    renderApp();

    if (
      emailChanged &&
      String(updatedUser.email || "").toLowerCase() !== email.toLowerCase()
    ) {
      elements.profileEmailInput.value = updatedUser.new_email || email;
      setMessage(
        elements.profileFeedback,
        `Profile saved. Confirm the email change using the link sent to ${email}. Your current email stays active until then.`,
        "success",
      );
    } else {
      setMessage(elements.profileFeedback, "Profile updated.", "success");
    }
  } catch (error) {
    if (shopSaved) {
      renderApp();
      setMessage(
        elements.profileFeedback,
        `Shop name saved, but the account profile could not be updated: ${error.message}`,
        "error",
      );
    } else {
      setMessage(
        elements.profileFeedback,
        `Could not update your profile: ${error.message}`,
        "error",
      );
    }
  } finally {
    setButtonBusy(elements.saveProfileButton, false);
  }
}

async function saveStockAlerts(event) {
  event.preventDefault();
  setMessage(elements.stockAlertsFeedback, "");
  const value = elements.defaultLowStockThreshold.value;
  const threshold = Number(value);
  if (value === "" || !Number.isInteger(threshold) || threshold < 0) {
    setMessage(
      elements.stockAlertsFeedback,
      "Enter a whole number of 0 or more.",
      "error",
    );
    return;
  }
  try {
    await patchShopSettings(state.session.user.id, {
      default_low_stock_threshold: threshold,
    });
    state.settings.default_low_stock_threshold = threshold;
    renderApp();
    setMessage(
      elements.stockAlertsFeedback,
      "Stock alert settings saved.",
      "success",
    );
  } catch (error) {
    setMessage(
      elements.stockAlertsFeedback,
      `Could not save stock alerts: ${error.message}`,
      "error",
    );
  }
}

async function saveExpiryReminders(event) {
  event.preventDefault();
  setMessage(elements.expiryRemindersFeedback, "");
  const value = Number($('input[name="expiryWarningDays"]:checked')?.value);
  if (![3, 7, 14].includes(value)) {
    setMessage(
      elements.expiryRemindersFeedback,
      "Choose 3, 7, or 14 days.",
      "error",
    );
    return;
  }
  try {
    await patchShopSettings(state.session.user.id, {
      expiry_warning_days: value,
    });
    state.settings.expiry_warning_days = value;
    renderApp();
    setMessage(
      elements.expiryRemindersFeedback,
      "Expiry reminders saved.",
      "success",
    );
  } catch (error) {
    setMessage(
      elements.expiryRemindersFeedback,
      `Could not save expiry reminders: ${error.message}`,
      "error",
    );
  }
}

function setSidebarOpen(open) {
  elements.appView.classList.toggle("sidebar-open", open);
  elements.sidebarToggle.setAttribute("aria-expanded", String(open));
  elements.sidebarToggle.setAttribute(
    "aria-label",
    open ? "Close navigation menu" : "Open navigation menu",
  );
  elements.sidebarScrim.classList.toggle("hidden", !open);
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.signupForm.addEventListener("submit", handleSignup);
  elements.loginTab.addEventListener("click", () => switchAuthTab("login"));
  elements.signupTab.addEventListener("click", () => switchAuthTab("signup"));
  $("#show-login").addEventListener("click", () => {
    switchAuthTab("login");
    $("#login-email").focus();
  });
  $("#show-signup").addEventListener("click", () => {
    switchAuthTab("signup");
    $("#signup-owner-name").focus();
  });
  $$(".password-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      const input = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password",
      );
      button.setAttribute("aria-pressed", String(show));
    }),
  );
  elements.themeToggle.addEventListener("click", () =>
    setTheme(getTheme() === "dark" ? "light" : "dark"),
  );
  elements.logoutButton.addEventListener("click", () => void handleLogout());
  elements.addProductLink.addEventListener("click", () => openProductDialog());
  elements.customerForm.addEventListener("submit", saveCustomer);
  elements.customerSearch.addEventListener("input", (event) => {
    state.customerSearch = event.target.value;
    renderKhata();
  });
  elements.customerList.addEventListener("click", handleCustomerAction);
  elements.cancelCustomerEdit.addEventListener("click", resetCustomerForm);
  $("#empty-add-customer").addEventListener("click", () => {
    state.view = "dashboard";
    setDashboardTab("khata");
    elements.customerName.focus();
  });
  elements.khataTransactionForm.addEventListener(
    "submit",
    saveKhataTransaction,
  );
  $("#close-khata-transaction").addEventListener(
    "click",
    closeKhataTransaction,
  );
  $("#cancel-khata-transaction").addEventListener(
    "click",
    closeKhataTransaction,
  );
  elements.khataTransactionDialog.addEventListener("click", (event) => {
    if (event.target === elements.khataTransactionDialog)
      closeKhataTransaction();
  });
  $("#cancel-product").addEventListener("click", closeProductDialog);
  $("#cancel-product-action").addEventListener("click", closeProductDialog);
  elements.productForm.addEventListener("submit", saveProduct);
  $("#open-json-import").addEventListener("click", () => {
    elements.jsonImportForm.reset();
    elements.jsonImportFeedback.textContent = "";
    elements.jsonImportDialog.showModal();
  });
  $("#close-json-import").addEventListener("click", () =>
    elements.jsonImportDialog.close(),
  );
  $("#cancel-json-import").addEventListener("click", () =>
    elements.jsonImportDialog.close(),
  );
  elements.jsonImportForm.addEventListener("submit", handleJsonStockImport);
  elements.jsonFileInput.addEventListener("change", async () => {
    const file = elements.jsonFileInput.files?.[0];
    if (!file) return;
    if (file.size > 1000000) {
      elements.jsonImportFeedback.textContent =
        "Choose a JSON file smaller than 1 MB.";
      elements.jsonFileInput.value = "";
      return;
    }
    try {
      elements.jsonImportInput.value = await file.text();
      elements.jsonImportFeedback.textContent = "";
    } catch (error) {
      elements.jsonImportFeedback.textContent = `Could not read the selected file: ${error.message}`;
    }
  });
  $("#open-manual-list").addEventListener("click", () => {
    elements.manualListForm.reset();
    elements.manualListFeedback.textContent = "";
    elements.manualListDialog.showModal();
  });
  $("#close-manual-list").addEventListener("click", () =>
    elements.manualListDialog.close(),
  );
  $("#cancel-manual-list").addEventListener("click", () =>
    elements.manualListDialog.close(),
  );
  elements.manualListForm.addEventListener("submit", handleManualStockImport);
  $("#sidebar-toggle").addEventListener("click", () =>
    setSidebarOpen(!elements.appView.classList.contains("sidebar-open")),
  );
  elements.sidebarScrim.addEventListener("click", () => setSidebarOpen(false));
  elements.productSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderApp();
    elements.productSearch.focus();
    elements.productSearch.setSelectionRange(
      state.search.length,
      state.search.length,
    );
  });
  document.addEventListener("click", (event) => {
    const dashboardTab = event.target.closest("[data-dashboard-tab]");
    if (dashboardTab) {
      setDashboardTab(dashboardTab.dataset.dashboardTab);
      return;
    }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton && elements.appView.contains(viewButton)) {
      setView(viewButton.dataset.view);
      return;
    }
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      openProductDialog();
      return;
    }
    const resetButton = event.target.closest("[data-empty-reset]");
    if (resetButton) {
      state.filter = "all";
      state.search = "";
      elements.productSearch.value = "";
      renderApp();
      return;
    }
    const filterButton = event.target.closest("[data-inventory-filter]");
    if (filterButton) {
      setActiveFilter(filterButton.dataset.inventoryFilter);
      return;
    }
    const summaryButton = event.target.closest("[data-summary-filter]");
    if (summaryButton) {
      const map = { all: "all", low: "low", soon: "soon", expired: "expired" };
      setActiveFilter(map[summaryButton.dataset.summaryFilter] || "all");
      setView("products");
    }
  });
  elements.dashboardTable.addEventListener("click", handleTableAction);
  elements.productsTable.addEventListener("click", handleTableAction);
  elements.profileForm.addEventListener("submit", saveProfile);
  $("#shop-details-form").addEventListener("submit", saveShopDetails);
  $("#stock-alerts-form").addEventListener("submit", saveStockAlerts);
  $("#expiry-reminders-form").addEventListener("submit", saveExpiryReminders);
  $("#restore-samples-button").addEventListener("click", () =>
    showConfirmDialog({
      title: "Restore sample products?",
      description:
        "This replaces your current inventory with the editable sample products.",
      confirmLabel: "Restore samples",
      action: "restore",
    }),
  );
  $("#clear-data-button").addEventListener("click", () =>
    showConfirmDialog({
      title: "Clear all products?",
      description:
        "This permanently removes all products from your Supabase inventory. Your shop settings will remain saved.",
      confirmLabel: "Clear all products",
      action: "clear",
    }),
  );
  $("#close-data-action").addEventListener("click", closeConfirmDialog);
  $("#cancel-data-action").addEventListener("click", closeConfirmDialog);
  elements.confirmDataAction.addEventListener(
    "click",
    () => void runConfirmedAction(),
  );
  elements.productDialog.addEventListener("click", (event) => {
    if (event.target === elements.productDialog) closeProductDialog();
  });
  [elements.jsonImportDialog, elements.manualListDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  elements.dataActionDialog.addEventListener("click", (event) => {
    if (event.target === elements.dataActionDialog) closeConfirmDialog();
  });
}

async function initialize() {
  setTheme(getTheme());
  elements.todayLabel.textContent = formatToday();
  elements.dashboardDate.textContent = formatToday();
  bindEvents();
  const savedSession = getStoredSession();
  if (!savedSession?.access_token || !savedSession?.user?.id) {
    showAuth();
    return;
  }
  try {
    const session = await refreshSessionIfNeeded(savedSession);
    if (!session?.access_token || !session?.user?.id) {
      saveSession(null);
      showAuth();
      return;
    }
    saveSession(session);
    await showSignedIn();
  } catch (error) {
    saveSession(null);
    showAuth();
    setMessage(
      elements.authMessage,
      `Your saved login expired. Please log in again. (${error.message})`,
      "error",
    );
  }
}

void initialize();

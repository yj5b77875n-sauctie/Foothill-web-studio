const LIMIT = 200;
const PLANS = {
  'mobile-rescue': 'Mobile Rescue', refresh: 'Refresh', 'new-build': 'New Build',
  'website-booking': 'Website + Booking', 'website-app': 'Website + Custom App',
  'care-basic': 'Basic Care', 'care-growth': 'Growth Care', 'care-concierge': 'Concierge Care',
  'social-presence': 'Social Presence', 'social-momentum': 'Social Momentum',
  'social-concierge': 'Social Concierge',
};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
// Database values are Stripe integer minor units. Avoid assuming every currency uses cents.
export function money(value, currency) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) return 'Unavailable';
  if (currency === 'usd') return `USD ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100)}`;
  return `${String(currency || 'Unknown currency').toUpperCase()} ${n.toLocaleString('en-US')} minor units`;
}
function date(value, unix = false) {
  if (!value) return 'Not available';
  const d = new Date(unix ? Number(value) * 1000 : value);
  return Number.isNaN(d.getTime()) ? 'Not available' : d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
export function paymentLabel(row) {
  if (row.status === 'failed') return ['Failed', 'bad'];
  if (row.status === 'pending') return ['Pending', 'warn'];
  if (Number(row.amount_refunded_cents) > 0) {
    return Number(row.amount_refunded_cents) >= Number(row.amount_captured_cents)
      ? ['Refunded', 'warn'] : ['Partially refunded', 'warn'];
  }
  if (Number(row.amount_captured_cents) > 0) return ['Captured', 'good'];
  if (row.paid && !row.captured) return ['Authorized, not captured', 'warn'];
  return [row.status || 'Unknown', ''];
}
function badge(label, tone = '') {
  return `<span class="billing-status ${tone}">${escapeHtml(label)}</span>`;
}
function review(row) {
  return row.needs_review ? '<small class="billing-review">Needs review · excluded from summaries</small>' : '';
}
function service(sku) { return escapeHtml(PLANS[sku] || sku || 'Unassigned service'); }
function stat(label, value) {
  return `<div class="billing-stat"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}
export function paymentTotals(rows) {
  const totals = {};
  for (const row of rows.filter(r => !r.needs_review)) {
    const key = row.currency || 'unknown';
    totals[key] ||= { captured: 0, refunded: 0 };
    totals[key].captured += Number(row.amount_captured_cents || 0);
    totals[key].refunded += Number(row.amount_refunded_cents || 0);
  }
  return totals;
}
function paymentSummary(rows) {
  const totals = Object.entries(paymentTotals(rows));
  const amounts = field => totals.length
    ? totals.map(([c, v]) => escapeHtml(money(v[field], c))).join('<br>')
    : 'No records';
  return stat('Captured · loaded records', amounts('captured'))
    + stat('Refunded · loaded records', amounts('refunded'))
    + stat('Needs review', String(rows.filter(r => r.needs_review).length));
}
function subscriptionSummary(rows) {
  const reliable = rows.filter(r => !r.needs_review);
  return stat('Active · loaded records', String(reliable.filter(r => r.status === 'active').length))
    + stat('Cancellation scheduled', String(reliable.filter(r => r.cancel_at_period_end && r.status !== 'canceled').length))
    + stat('Needs review', String(rows.filter(r => r.needs_review).length));
}
function paymentRows(rows) {
  return rows.map(r => `<tr>
    <td><strong>${service(r.sku)}</strong><small><code>${escapeHtml(r.charge_id)}</code></small>${review(r)}</td>
    <td><code>${escapeHtml(r.customer_id || 'No customer ID')}</code></td>
    <td>${badge(...paymentLabel(r))}</td>
    <td class="amount">${escapeHtml(money(r.amount_captured_cents, r.currency))}</td>
    <td class="amount">${escapeHtml(money(r.amount_refunded_cents, r.currency))}</td>
    <td>${escapeHtml(date(r.updated_at))}</td></tr>`).join('');
}
function subscriptionRows(rows) {
  return rows.map(r => {
    const tone = ['active', 'trialing'].includes(r.status) ? 'good'
      : ['past_due', 'unpaid', 'incomplete'].includes(r.status) ? 'warn' : '';
    const cancellation = r.status === 'canceled' ? 'Canceled'
      : r.cancel_at_period_end ? 'At period end' : 'Not scheduled';
    return `<tr>
      <td><strong>${service(r.sku)}</strong><small><code>${escapeHtml(r.subscription_id)}</code></small>${review(r)}</td>
      <td><code>${escapeHtml(r.customer_id || 'No customer ID')}</code></td>
      <td>${badge(String(r.status || 'Unknown').replaceAll('_', ' '), tone)}</td>
      <td>${escapeHtml(cancellation)}</td>
      <td>${escapeHtml(date(r.current_period_end, true))}</td>
      <td>${escapeHtml(date(r.updated_at))}</td></tr>`;
  }).join('');
}
export function createBillingSection(client) {
  const el = id => document.getElementById(id);
  let loading = false;
  async function loadTable(kind) {
    const payments = kind === 'payment';
    const body = el(payments ? 'payments-body' : 'subscriptions-body');
    const summary = el(`${kind}-summary`);
    const scope = el(`${kind}-scope`);
    summary.innerHTML = '';
    scope.textContent = '';
    body.innerHTML = '<tr><td colspan="6" class="billing-message">Loading protected records…</td></tr>';
    try {
      const result = await Promise.race([
        client.rpc(payments ? 'studio_payment_records' : 'studio_subscription_records', { p_limit: LIMIT }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000)),
      ]);
      if (result.error || !Array.isArray(result.data)) throw new Error('Billing records unavailable');
      const rows = result.data;
      summary.innerHTML = payments ? paymentSummary(rows) : subscriptionSummary(rows);
      scope.textContent = `${rows.length} ${payments ? 'payment' : 'subscription'} records loaded${rows.length === LIMIT ? ' · limit reached; older records are not shown' : ''}. Records flagged for review are excluded from amount and status summaries.`;
      body.innerHTML = rows.length ? (payments ? paymentRows(rows) : subscriptionRows(rows))
        : `<tr><td colspan="6" class="billing-message">No ${payments ? 'payment' : 'subscription'} records received yet. Records appear after relevant Stripe webhook events; older activity is not imported automatically.</td></tr>`;
      return true;
    } catch {
      body.innerHTML = '<tr><td colspan="6" class="billing-message error">Could not load protected records. Check your connection and studio access, then use Refresh billing. If access expired, sign out and sign in again.</td></tr>';
      scope.textContent = 'Unavailable. No zero balance or empty-record claim is shown while this request has failed.';
      return false;
    }
  }
  async function load() {
    if (loading) return;
    loading = true;
    const button = el('billing-refresh');
    button.disabled = true;
    button.textContent = 'Refreshing…';
    el('billing').setAttribute('aria-busy', 'true');
    el('billing-load-status').textContent = 'Loading payments and subscriptions…';
    try {
      const results = await Promise.all([loadTable('payment'), loadTable('subscription')]);
      el('billing-load-status').textContent = `${results.every(Boolean) ? 'Both tables refreshed' : 'Refresh incomplete; see the affected table'} · ${date(new Date().toISOString())}`;
    } finally {
      loading = false;
      button.disabled = false;
      button.textContent = 'Refresh billing';
      el('billing').setAttribute('aria-busy', 'false');
    }
  }
  el('billing-refresh').addEventListener('click', load);
  return { load };
}

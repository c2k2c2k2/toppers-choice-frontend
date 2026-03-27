"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminPlan,
  formatAdminDateTime,
  formatPricePaise,
  getAdminPaymentOrder,
  getApiErrorMessage,
  listAdminPaymentOrders,
  listAdminPlans,
  parseOptionalInteger,
  reconcileAdminPaymentOrder,
  safeJsonParseArray,
  stringifyJsonInput,
  updateAdminPlan,
  type PaymentOrderStatus,
  type PlanStatus,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type CommerceTab = "plans" | "payments";

interface PlanFormState {
  code: string;
  currencyCode: string;
  description: string;
  durationDays: string;
  entitlementsJson: string;
  metadataJson: string;
  name: string;
  pricePaise: string;
  shortDescription: string;
  slug: string;
  sortOrder: string;
  status: PlanStatus;
}

const PLAN_STATUS_OPTIONS: PlanStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const PAYMENT_STATUS_OPTIONS: PaymentOrderStatus[] = [
  "CREATED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
];

const EMPTY_PLAN_FORM_STATE: PlanFormState = {
  code: "",
  currencyCode: "INR",
  description: "",
  durationDays: "",
  entitlementsJson: "",
  metadataJson: "",
  name: "",
  pricePaise: "",
  shortDescription: "",
  slug: "",
  sortOrder: "",
  status: "INACTIVE",
};

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function buildPlanFormState(
  plan: Awaited<ReturnType<typeof listAdminPlans>>["items"][number] | null,
): PlanFormState {
  if (!plan) {
    return EMPTY_PLAN_FORM_STATE;
  }

  return {
    code: plan.code,
    currencyCode: plan.currencyCode,
    description: typeof plan.description === "string" ? plan.description : "",
    durationDays: String(plan.durationDays),
    entitlementsJson: stringifyJsonInput(
      plan.entitlements.map((entitlement) => ({
        entitlementKind: entitlement.entitlementKind,
        orderIndex: entitlement.orderIndex,
        scopeJson: entitlement.scopeJson,
      })),
    ),
    metadataJson: stringifyJsonInput(plan.metadataJson),
    name: plan.name,
    pricePaise: String(plan.pricePaise),
    shortDescription:
      typeof plan.shortDescription === "string" ? plan.shortDescription : "",
    slug: plan.slug,
    sortOrder: String(plan.sortOrder),
    status: plan.status,
  };
}

export function AdminCommerceScreen({
  initialTab,
}: Readonly<{
  initialTab: CommerceTab;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const canRead = authSession.hasPermission("payments.read");
  const canManage = authSession.hasPermission("payments.manage");
  const [searchValue, setSearchValue] = useState("");
  const [planStatus, setPlanStatus] = useState<PlanStatus | "">("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(EMPTY_PLAN_FORM_STATE);
  const [paymentStatus, setPaymentStatus] = useState<PaymentOrderStatus | "">("");
  const [paymentUserId, setPaymentUserId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const plansQuery = useAuthenticatedQuery({
    enabled: initialTab === "plans" && canRead,
    queryFn: (accessToken) =>
      listAdminPlans(accessToken, {
        search: searchValue || undefined,
        status: planStatus || undefined,
      }),
    queryKey: adminQueryKeys.plans({
      search: searchValue || null,
      status: planStatus || null,
    }),
    staleTime: 30_000,
  });

  const paymentOrdersQuery = useAuthenticatedQuery({
    enabled: initialTab === "payments" && canRead,
    queryFn: (accessToken) =>
      listAdminPaymentOrders(accessToken, {
        status: paymentStatus || undefined,
        userId: paymentUserId || undefined,
      }),
    queryKey: adminQueryKeys.payments({
      provider: null,
      status: paymentStatus || null,
      userId: paymentUserId || null,
    }),
    staleTime: 30_000,
  });

  const paymentOrderDetailQuery = useAuthenticatedQuery({
    enabled: initialTab === "payments" && canRead && Boolean(selectedOrderId),
    queryFn: (accessToken) => getAdminPaymentOrder(selectedOrderId ?? "", accessToken),
    queryKey: ["admin", "payments", "detail", selectedOrderId ?? "new"],
    staleTime: 30_000,
  });

  const selectedPlan = useMemo(() => {
    const items = plansQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }

    return items.find((plan) => plan.id === selectedPlanId) ?? items[0];
  }, [plansQuery.data?.items, selectedPlanId]);

  const selectedOrder = paymentOrderDetailQuery.data ?? null;

  useEffect(() => {
    setPlanForm(buildPlanFormState(selectedPlan));
  }, [selectedPlan]);

  const savePlanMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        code: planForm.code.trim(),
        currencyCode: planForm.currencyCode.trim() || "INR",
        description: planForm.description.trim() || undefined,
        durationDays: parseOptionalInteger(planForm.durationDays),
        entitlements: (safeJsonParseArray(planForm.entitlementsJson, {
          allowEmpty: false,
          label: "Entitlements JSON",
        }) ?? []) as Array<{
          entitlementKind:
            | "NOTES_PREMIUM"
            | "CONTENT_PREMIUM"
            | "PRACTICE_PREMIUM"
            | "TESTS_PREMIUM"
            | "ALL_PREMIUM";
          orderIndex?: number;
          scopeJson?: Record<string, never>;
        }>,
        metadataJson: planForm.metadataJson.trim()
          ? (JSON.parse(planForm.metadataJson) as Record<string, never>)
          : undefined,
        name: planForm.name.trim(),
        pricePaise: parseOptionalInteger(planForm.pricePaise),
        shortDescription: planForm.shortDescription.trim() || undefined,
        slug: planForm.slug.trim() || undefined,
        sortOrder: parseOptionalInteger(planForm.sortOrder),
        status: planForm.status,
      };

      if (!input.code || !input.name || !input.durationDays || !input.pricePaise) {
        throw new Error("Code, name, price, and duration are required.");
      }

      const normalizedInput = {
        ...input,
        durationDays: input.durationDays,
        pricePaise: input.pricePaise,
      };

      if (selectedPlan) {
        return updateAdminPlan(
          selectedPlan.id,
          normalizedInput,
          accessToken,
        );
      }

      return createAdminPlan(normalizedInput, accessToken);
    },
    onSuccess: async (plan) => {
      setSelectedPlanId(plan.id);
      setMessage("Plan saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });

  const reconcileMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!selectedOrderId) {
        throw new Error("Select an order first.");
      }

      return reconcileAdminPaymentOrder(selectedOrderId, accessToken);
    },
    onSuccess: async (order) => {
      setSelectedOrderId(order.id);
      setMessage("Payment order reconciled.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "payments"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "payments", "detail", order.id],
        }),
      ]);
    },
  });

  if (!canRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="Commerce visibility is locked."
        description="This session does not currently expose payments read permissions."
      />
    );
  }

  if (
    (initialTab === "plans" && plansQuery.isLoading) ||
    (initialTab === "payments" && (paymentOrdersQuery.isLoading || paymentOrderDetailQuery.isLoading))
  ) {
    return (
      <LoadingState
        title={`Loading ${initialTab} workspace`}
        description="Pulling plan catalog and payment order state from the backend commerce contracts."
      />
    );
  }

  if (
    (initialTab === "plans" && plansQuery.error) ||
    (initialTab === "payments" && (paymentOrdersQuery.error || paymentOrderDetailQuery.error))
  ) {
    return (
      <ErrorState
        title="The commerce workspace could not be loaded."
        description="One or more plans or payments queries failed."
        onRetry={() => {
          if (initialTab === "plans") {
            void plansQuery.refetch();
            return;
          }

          void paymentOrdersQuery.refetch();
          void paymentOrderDetailQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Commerce"
        title={initialTab === "plans" ? "Plan catalog is now editable." : "Payment order support is now live."}
        description={
          initialTab === "plans"
            ? "Plan definitions, entitlement bundles, and pricing metadata now live in the admin panel instead of staying backend-only."
            : "Orders now surface enough operational detail for support and finance admins to inspect and reconcile provider state."
        }
      />

      <AdminRouteTabs
        activeHref={initialTab === "plans" ? "/admin/plans" : "/admin/payments"}
        items={[
          {
            href: "/admin/plans",
            label: "Plans",
            description: "Plan code, pricing, duration, and entitlement bundles.",
          },
          {
            href: "/admin/payments",
            label: "Payments",
            description: "Orders, status transitions, and manual reconcile actions.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={initialTab === "plans" ? "Search plans by name, code, or slug" : "Search is reserved for plans; payments can filter by user and status"}
        resultSummary={`${
          initialTab === "plans"
            ? plansQuery.data?.items.length ?? 0
            : paymentOrdersQuery.data?.items.length ?? 0
        } ${initialTab} visible.`}
      >
        {initialTab === "plans" ? (
          <label className="tc-form-field min-w-[12rem]">
            <span className="tc-form-label">Status</span>
            <select
              value={planStatus}
              onChange={(event) => setPlanStatus(event.target.value as PlanStatus | "")}
              className="tc-input"
            >
              <option value="">All statuses</option>
              {PLAN_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Order status</span>
              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as PaymentOrderStatus | "")
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <AdminInput
              label="User ID"
              value={paymentUserId}
              onChange={(event) => setPaymentUserId(event.target.value)}
            />
          </>
        )}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {initialTab === "plans" && savePlanMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(savePlanMutation.error, "The plan could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "payments" && reconcileMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            reconcileMutation.error,
            "The payment order could not be reconciled.",
          )}
        </AdminInlineNotice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <section>
          {initialTab === "plans" ? (
            <AdminDataTable
              rows={plansQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedPlan?.id ?? null}
              onRowClick={(row) => setSelectedPlanId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Plans"
                  title="No plans matched the current filters."
                  description="Create a new plan to seed the student pricing surface."
                />
              }
              columns={[
                {
                  header: "Plan",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.name}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.code} · {row.slug}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Price",
                  render: (row) => (
                    <p className="text-sm font-semibold text-[color:var(--brand)]">
                      {formatPricePaise(row.pricePaise, row.currencyCode)}
                    </p>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "ACTIVE" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Entitlements",
                  render: (row) => (
                    <p className="text-sm text-[color:var(--muted)]">
                      {row.entitlements.length} items
                    </p>
                  ),
                },
              ]}
            />
          ) : (
            <AdminDataTable
              rows={paymentOrdersQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedOrderId}
              onRowClick={(row) => setSelectedOrderId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Payments"
                  title="No payment orders matched the current filters."
                  description="This workspace will populate as soon as checkout attempts begin."
                />
              }
              columns={[
                {
                  header: "Order",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">
                        {row.merchantOrderCode}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">{row.id}</p>
                    </div>
                  ),
                },
                {
                  header: "User",
                  render: (row) => (
                    <p className="text-sm text-[color:var(--muted)]">
                      {row.user.fullName}
                      <br />
                      {row.user.email}
                    </p>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "SUCCEEDED" ? "live" : row.status === "FAILED" || row.status === "CANCELLED" || row.status === "EXPIRED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Amount",
                  render: (row) => formatPricePaise(row.amountPaise, row.currencyCode),
                },
              ]}
            />
          )}
        </section>

        <section className="tc-card rounded-[28px] p-6">
          {initialTab === "plans" ? (
            <div className="grid gap-4">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                {selectedPlan ? "Update plan" : "Create plan"}
              </h2>
              <AdminInput
                label="Name"
                value={planForm.name}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Code"
                  value={planForm.code}
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
                <AdminInput
                  label="Slug"
                  value={planForm.slug}
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <AdminInput
                  label="Price paise"
                  type="number"
                  value={planForm.pricePaise}
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, pricePaise: event.target.value }))
                  }
                />
                <AdminInput
                  label="Duration days"
                  type="number"
                  value={planForm.durationDays}
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, durationDays: event.target.value }))
                  }
                />
                <AdminInput
                  label="Sort order"
                  type="number"
                  value={planForm.sortOrder}
                  onChange={(event) =>
                    setPlanForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Currency"
                  value={planForm.currencyCode}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      currencyCode: event.target.value,
                    }))
                  }
                />
                <AdminSelect
                  label="Status"
                  value={planForm.status}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      status: event.target.value as PlanStatus,
                    }))
                  }
                >
                  {PLAN_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <AdminTextarea
                label="Short description"
                value={planForm.shortDescription}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Description"
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Entitlements JSON"
                hint='Example: [{"entitlementKind":"ALL_PREMIUM","orderIndex":0}]'
                value={planForm.entitlementsJson}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    entitlementsJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Metadata JSON"
                value={planForm.metadataJson}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    metadataJson: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="tc-button-primary"
                disabled={!canManage || savePlanMutation.isPending}
                onClick={() => savePlanMutation.mutate()}
              >
                {savePlanMutation.isPending ? "Saving..." : "Save plan"}
              </button>
            </div>
          ) : selectedOrder ? (
            <div className="grid gap-4">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                Payment order detail
              </h2>
              <div className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/80 p-4 text-sm leading-6">
                <p>
                  <strong>User:</strong> {selectedOrder.user.fullName} ({selectedOrder.user.email})
                </p>
                <p>
                  <strong>Plan:</strong> {selectedOrder.plan.name}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
                <p>
                  <strong>Provider:</strong> {selectedOrder.provider}
                </p>
                <p>
                  <strong>Amount:</strong>{" "}
                  {formatPricePaise(selectedOrder.amountPaise, selectedOrder.currencyCode)}
                </p>
                <p>
                  <strong>Created:</strong> {formatAdminDateTime(selectedOrder.createdAt)}
                </p>
                <p>
                  <strong>Updated:</strong> {formatAdminDateTime(selectedOrder.updatedAt)}
                </p>
                <p>
                  <strong>Provider ref:</strong>{" "}
                  {getOptionalText(selectedOrder.providerReferenceId) ?? "Not available"}
                </p>
              </div>
              <button
                type="button"
                className="tc-button-primary"
                disabled={!canManage || reconcileMutation.isPending}
                onClick={() => reconcileMutation.mutate()}
              >
                {reconcileMutation.isPending ? "Reconciling..." : "Reconcile order"}
              </button>
            </div>
          ) : (
            <EmptyState
              eyebrow="Payments"
              title="Select an order to inspect support details."
              description="Order detail, provider status, and reconcile actions will appear here."
            />
          )}
        </section>
      </div>
    </div>
  );
}

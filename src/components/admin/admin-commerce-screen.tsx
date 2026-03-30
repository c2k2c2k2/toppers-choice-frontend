"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  updateAdminPlan,
  type PaymentOrderStatus,
  type PlanStatus,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminKeyValueEditor,
  parseKeyValueObject,
  serializeKeyValueRows,
  type AdminKeyValueRow,
} from "@/components/admin/admin-key-value-editor";
import { AdminFontTextField } from "@/components/admin/admin-font-text-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";

type CommerceTab = "plans" | "payments";
type PlanEntitlementKind =
  | "NOTES_PREMIUM"
  | "CONTENT_PREMIUM"
  | "PRACTICE_PREMIUM"
  | "TESTS_PREMIUM"
  | "ALL_PREMIUM";

interface PlanEntitlementFormRow {
  entitlementKind: PlanEntitlementKind;
  id: string;
  orderIndex: string;
  scopeRows: AdminKeyValueRow[];
}

interface PlanFormState {
  code: string;
  currencyCode: string;
  description: string;
  durationDays: string;
  entitlements: PlanEntitlementFormRow[];
  metadataRows: AdminKeyValueRow[];
  name: string;
  pricePaise: string;
  shortDescription: string;
  slug: string;
  sortOrder: string;
  status: PlanStatus;
}

const PLAN_STATUS_OPTIONS: PlanStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const PLAN_ENTITLEMENT_OPTIONS: PlanEntitlementKind[] = [
  "ALL_PREMIUM",
  "NOTES_PREMIUM",
  "CONTENT_PREMIUM",
  "PRACTICE_PREMIUM",
  "TESTS_PREMIUM",
];
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
  entitlements: [],
  metadataRows: [],
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

function createEntitlementRow(
  partial?: Partial<PlanEntitlementFormRow>,
): PlanEntitlementFormRow {
  return {
    entitlementKind: "ALL_PREMIUM",
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entitlement-${Math.random().toString(36).slice(2, 10)}`,
    orderIndex: "",
    scopeRows: [],
    ...partial,
  };
}

function buildPlanFormState(
  plan: Awaited<ReturnType<typeof listAdminPlans>>["items"][number] | null,
): PlanFormState {
  if (!plan) {
    return {
      ...EMPTY_PLAN_FORM_STATE,
      entitlements: [createEntitlementRow()],
    };
  }

  return {
    code: plan.code,
    currencyCode: plan.currencyCode,
    description: typeof plan.description === "string" ? plan.description : "",
    durationDays: String(plan.durationDays),
    entitlements: plan.entitlements.map((entitlement) =>
      createEntitlementRow({
        entitlementKind: entitlement.entitlementKind as PlanEntitlementKind,
        orderIndex:
          typeof entitlement.orderIndex === "number"
            ? String(entitlement.orderIndex)
            : "",
        scopeRows: parseKeyValueObject(entitlement.scopeJson),
      }),
    ),
    metadataRows: parseKeyValueObject(plan.metadataJson),
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
  planId = null,
  planView = "workspace",
}: Readonly<{
  initialTab: CommerceTab;
  planId?: string | null;
  planView?: "editor" | "list" | "workspace";
}>) {
  const authSession = useAuthSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const canRead = authSession.hasPermission("payments.read");
  const canManage = authSession.hasPermission("payments.manage");
  const [searchValue, setSearchValue] = useState("");
  const [planStatus, setPlanStatus] = useState<PlanStatus | "">("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(() => buildPlanFormState(null));
  const [paymentStatus, setPaymentStatus] = useState<PaymentOrderStatus | "">("");
  const [paymentUserId, setPaymentUserId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isPlanEditorMode = initialTab === "plans" && planView === "editor";
  const isPlanListMode = initialTab === "plans" && planView === "list";
  const isCreatingPlan = isPlanEditorMode && !planId;

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

    if (isPlanEditorMode) {
      if (!planId || !items.length) {
        return null;
      }

      return items.find((plan) => plan.id === planId) ?? null;
    }

    if (!items.length) {
      return null;
    }

    return items.find((plan) => plan.id === selectedPlanId) ?? items[0];
  }, [isPlanEditorMode, planId, plansQuery.data?.items, selectedPlanId]);

  const selectedOrder = paymentOrderDetailQuery.data ?? null;

  useEffect(() => {
    if (initialTab === "plans") {
      setSelectedPlanId(planId ?? null);
    }
  }, [initialTab, planId]);

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
        entitlements: planForm.entitlements
          .map((entitlement) => ({
            entitlementKind: entitlement.entitlementKind,
            orderIndex: parseOptionalInteger(entitlement.orderIndex),
            scopeJson: serializeKeyValueRows(entitlement.scopeRows) as
              | Record<string, never>
              | undefined,
          }))
          .filter((entitlement) => Boolean(entitlement.entitlementKind)),
        metadataJson: serializeKeyValueRows(planForm.metadataRows) as
          | Record<string, never>
          | undefined,
        name: planForm.name.trim(),
        pricePaise: parseOptionalInteger(planForm.pricePaise),
        shortDescription: planForm.shortDescription.trim() || undefined,
        slug: planForm.slug.trim() || undefined,
        sortOrder: parseOptionalInteger(planForm.sortOrder),
        status: planForm.status,
      };

      if (
        !input.code ||
        !input.name ||
        !input.durationDays ||
        !input.pricePaise ||
        input.entitlements.length === 0
      ) {
        throw new Error(
          "Code, name, price, duration, and at least one entitlement are required.",
        );
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

      if (isPlanEditorMode) {
        router.replace(`/admin/plans/${plan.id}`);
      }
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
        title="This section is not available for this login."
        description="Ask an admin with payment access to open this section or update your role."
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
        description="Fetching the latest plans and payment records."
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
        description="We couldn't load plans or payments right now."
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
        title={
          initialTab === "plans"
            ? isPlanEditorMode
              ? isCreatingPlan
                ? "Create plan"
                : "Edit plan"
              : "Plans"
            : "Payments"
        }
        description={
          initialTab === "plans"
            ? isPlanEditorMode
              ? "Use one focused editor page for plan pricing, access, and Marathi-ready content fields."
              : "Review plan rows here, then open a separate page to create or edit one plan at a time."
            : "Review payment orders, statuses, and support details."
        }
        actions={
          initialTab === "plans" ? (
            isPlanEditorMode ? (
              <Link href="/admin/plans" className="tc-button-secondary">
                Back to plans
              </Link>
            ) : (
              <Link href="/admin/plans/new" className="tc-button-primary">
                Create plan
              </Link>
            )
          ) : null
        }
      />

      <AdminRouteTabs
        activeHref={initialTab === "plans" ? "/admin/plans" : "/admin/payments"}
        items={[
          {
            href: "/admin/plans",
            label: "Plans",
            description: "Plan code, pricing, duration, and included access.",
          },
          {
            href: "/admin/payments",
            label: "Payments",
            description: "Orders, payment status, and manual checks.",
          },
        ]}
      />

      {initialTab === "payments" || !isPlanEditorMode ? (
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
      ) : null}

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

      <div
        className={
          initialTab === "plans" && (isPlanEditorMode || isPlanListMode)
            ? "grid gap-6"
            : "grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]"
        }
      >
        {initialTab === "plans" && !isPlanEditorMode ? (
          <section>
            <AdminDataTable
              rows={plansQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={isPlanListMode ? null : selectedPlan?.id ?? null}
              onRowClick={(row) =>
                isPlanListMode ? router.push(`/admin/plans/${row.id}`) : setSelectedPlanId(row.id)
              }
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
                      <TextContent
                        as="p"
                        className="font-semibold text-[color:var(--brand)]"
                        value={row.name}
                      />
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
          </section>
        ) : initialTab === "payments" ? (
          <section>
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
          </section>
        ) : null}

        {initialTab === "plans" && !isPlanListMode ? (
          <section className="tc-card rounded-[28px] p-6">
            {isPlanEditorMode && !isCreatingPlan && !selectedPlan ? (
              <EmptyState
                eyebrow="Plans"
                title="That plan could not be found."
                description="Return to the plans table and choose another record."
              />
            ) : (
            <div className="grid gap-4">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                {selectedPlan ? "Update plan" : "Create plan"}
              </h2>
              <AdminFontTextField
                label="Name"
                storage="html"
                value={planForm.name}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, name: event }))
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
              <AdminFontTextField
                label="Short description"
                multiline
                preserveParagraphs
                rows={3}
                storage="html"
                value={planForm.shortDescription}
                onChange={(value) =>
                  setPlanForm((current) => ({
                    ...current,
                    shortDescription: value,
                  }))
                }
              />
              <AdminFontTextField
                label="Description"
                multiline
                preserveParagraphs
                rows={6}
                storage="html"
                value={planForm.description}
                onChange={(value) =>
                  setPlanForm((current) => ({
                    ...current,
                    description: value,
                  }))
                }
              />
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="tc-form-label">Included access</p>
                    <p className="text-xs leading-5 text-[color:var(--muted)]">
                      Define exactly what this plan unlocks.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() =>
                      setPlanForm((current) => ({
                        ...current,
                        entitlements: [...current.entitlements, createEntitlementRow()],
                      }))
                    }
                  >
                    Add entitlement
                  </button>
                </div>

                {planForm.entitlements.map((entitlement) => (
                  <div
                    key={entitlement.id}
                    className="grid gap-4 rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/80 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem]">
                      <AdminSelect
                        label="Entitlement type"
                        value={entitlement.entitlementKind}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            entitlements: current.entitlements.map((currentEntitlement) =>
                              currentEntitlement.id === entitlement.id
                                ? {
                                    ...currentEntitlement,
                                    entitlementKind: event.target.value as PlanEntitlementKind,
                                  }
                                : currentEntitlement,
                            ),
                          }))
                        }
                      >
                        {PLAN_ENTITLEMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </AdminSelect>
                      <AdminInput
                        label="Order"
                        type="number"
                        value={entitlement.orderIndex}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            entitlements: current.entitlements.map((currentEntitlement) =>
                              currentEntitlement.id === entitlement.id
                                ? {
                                    ...currentEntitlement,
                                    orderIndex: event.target.value,
                                  }
                                : currentEntitlement,
                            ),
                          }))
                        }
                      />
                    </div>

                    <AdminKeyValueEditor
                      hint="Optional scope fields like track, medium, or entitlement-specific notes."
                      label="Scope details"
                      rows={entitlement.scopeRows}
                      onChange={(rows) =>
                        setPlanForm((current) => ({
                          ...current,
                          entitlements: current.entitlements.map((currentEntitlement) =>
                            currentEntitlement.id === entitlement.id
                              ? {
                                  ...currentEntitlement,
                                  scopeRows: rows,
                                }
                              : currentEntitlement,
                          ),
                        }))
                      }
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="tc-button-secondary"
                        disabled={planForm.entitlements.length <= 1}
                        onClick={() =>
                          setPlanForm((current) => ({
                            ...current,
                            entitlements: current.entitlements.filter(
                              (currentEntitlement) => currentEntitlement.id !== entitlement.id,
                            ),
                          }))
                        }
                      >
                        Remove entitlement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <AdminKeyValueEditor
                hint="Optional plan metadata such as secondary CTA labels or pricing notes."
                label="Plan metadata"
                rows={planForm.metadataRows}
                onChange={(rows) =>
                  setPlanForm((current) => ({
                    ...current,
                    metadataRows: rows,
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
            )}
          </section>
        ) : initialTab === "payments" && selectedOrder ? (
          <section className="tc-card rounded-[28px] p-6">
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
          </section>
        ) : initialTab === "payments" ? (
          <section className="tc-card rounded-[28px] p-6">
            <EmptyState
              eyebrow="Payments"
              title="Select an order to inspect support details."
              description="Order detail, provider status, and reconcile actions will appear here."
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

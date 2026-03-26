export interface PublicPlanEntitlement {
  id: string;
  entitlementKind: string;
  scopeJson: Record<string, unknown> | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPlan {
  id: string;
  code: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  pricePaise: number;
  currencyCode: string;
  durationDays: number;
  sortOrder: number;
  status: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  entitlements: PublicPlanEntitlement[];
}

export interface PublicPlansListResponse {
  items: PublicPlan[];
  total: number;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PaymentOrderStatus,
  PremiumIntent,
} from "@/lib/payments";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface PaymentCheckoutSlice {
  activeOrderId: string | null;
  activePlanId: string | null;
  intent: PremiumIntent | null;
  merchantOrderCode: string | null;
  returnTo: string | null;
  source: string | null;
  startedAt: string | null;
  status: PaymentOrderStatus | null;
}

interface PaymentCheckoutActions {
  clearCheckout: () => void;
  startCheckout: (input: {
    orderId: string;
    planId: string | null;
    intent: PremiumIntent | null;
    merchantOrderCode: string | null;
    returnTo: string | null;
    source: string | null;
    startedAt?: string | null;
    status: PaymentOrderStatus;
  }) => void;
  syncCheckoutStatus: (input: {
    merchantOrderCode?: string | null;
    status: PaymentOrderStatus;
  }) => void;
}

export type PaymentCheckoutStore = PaymentCheckoutSlice & PaymentCheckoutActions;

const initialPaymentCheckoutState: PaymentCheckoutSlice = {
  activeOrderId: null,
  activePlanId: null,
  intent: null,
  merchantOrderCode: null,
  returnTo: null,
  source: null,
  startedAt: null,
  status: null,
};

export const usePaymentCheckoutStore = create<PaymentCheckoutStore>()(
  persist(
    (set) => ({
      ...initialPaymentCheckoutState,
      clearCheckout: () => set(initialPaymentCheckoutState),
      startCheckout: (input) =>
        set({
          activeOrderId: input.orderId,
          activePlanId: input.planId,
          intent: input.intent,
          merchantOrderCode: input.merchantOrderCode,
          returnTo: input.returnTo,
          source: input.source,
          startedAt: input.startedAt ?? new Date().toISOString(),
          status: input.status,
        }),
      syncCheckoutStatus: (input) =>
        set((state) => ({
          merchantOrderCode: input.merchantOrderCode ?? state.merchantOrderCode,
          status: input.status,
        })),
    }),
    buildSessionPersistOptions<PaymentCheckoutStore>(
      "payment-checkout",
      (state) => ({
        activeOrderId: state.activeOrderId,
        activePlanId: state.activePlanId,
        intent: state.intent,
        merchantOrderCode: state.merchantOrderCode,
        returnTo: state.returnTo,
        source: state.source,
        startedAt: state.startedAt,
        status: state.status,
      }),
    ),
  ),
);

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";

export type TrialAccessStatus = "ACTIVE" | "EXHAUSTED" | "DISABLED";

export interface TrialPolicy {
  enabled: boolean;
  totalSeconds: number;
  totalMinutes: number;
  heartbeatSeconds: number;
  maxHeartbeatGapSeconds: number;
}

export interface TrialAccess {
  id: string | null;
  status: TrialAccessStatus;
  enabled: boolean;
  consumedSeconds: number;
  remainingSeconds: number;
  totalSeconds: number;
  hasAccess: boolean;
  startedAt: string | null;
  lastHeartbeatAt: string | null;
  lastStoppedAt: string | null;
  exhaustedAt: string | null;
  disabledAt: string | null;
  policy: TrialPolicy;
}

function withAccessToken(accessToken: string, options?: ApiRequestOptions) {
  return {
    ...options,
    accessToken,
  };
}

export function getCurrentTrial(accessToken: string, options?: ApiRequestOptions) {
  return apiRequest<TrialAccess>(
    apiRoutes.trial.me,
    withAccessToken(accessToken, options),
  );
}

export function getPublicTrialPolicy(options?: ApiRequestOptions) {
  return apiRequest<TrialPolicy>(apiRoutes.public.trialPolicy, options);
}

export function startTrial(accessToken: string) {
  return apiRequest<TrialAccess>(apiRoutes.trial.start, {
    accessToken,
    method: "POST",
  });
}

export function heartbeatTrial(accessToken: string) {
  return apiRequest<TrialAccess>(apiRoutes.trial.heartbeat, {
    accessToken,
    method: "POST",
  });
}

export function stopTrial(accessToken: string) {
  return apiRequest<TrialAccess>(apiRoutes.trial.stop, {
    accessToken,
    method: "POST",
  });
}

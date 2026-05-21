import axiosInstance from "./axiosInstance";

export const generateAiActionPlanDraft = async (payload: {
  prompt: string;
  inserted_by: string;
  scope: "my" | "team";
}) => {
  const response = await axiosInstance.post("/api/ai/action-plan/draft", payload);
  return response.data;
};

export const createAiActionPlan = async (draft: any) => {
  const response = await axiosInstance.post("/api/ai/action-plan/create", draft);
  return response.data;
};

export type IaAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type IaAssistantConversationState = {
  objective?: string | null;
  responsible_team?: string | null;
  responsible_type?: "person" | "team" | "unknown" | null;
  responsible_display_name?: string | null;
  responsible_email?: string | null;
  responsible_department?: string | null;
  responsible_confidence?: number | null;
  responsible_candidates?: IaAssistantResponsibleCandidate[];
  pending_responsible_query?: string | null;
  responsible_needs_confirmation?: boolean;
  deadline?: string | null;
  include_subactions?: boolean | null;
  include_monitoring?: boolean | null;
  include_escalation?: boolean | null;
  urgency?: string | null;
  scope?: "my" | "team";
  current_step?:
    | "objective"
    | "responsible_team"
    | "responsible_confirmation"
    | "deadline"
    | "subactions"
    | "urgency"
    | "ready_to_create";
};

export type IaAssistantResponsibleCandidate = {
  type?: "person" | "team" | "unknown";
  display_name?: string | null;
  email?: string | null;
  department?: string | null;
  job_title?: string | null;
  site?: string | null;
  confidence?: number;
  reason?: string | null;
};

export const chatWithIaAssistant = async (payload: {
  messages: IaAssistantMessage[];
  inserted_by: string;
  scope: "my" | "team";
  conversation_state?: IaAssistantConversationState | null;
}) => {
  const response = await axiosInstance.post("/api/ai/assistant/chat", payload);
  return response.data;
};

export const createIaAssistantPlan = async (payload: {
  draft: any;
  inserted_by: string;
  scope: "my" | "team";
}) => {
  const response = await axiosInstance.post("/api/ai/assistant/create", payload);
  return response.data;
};

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

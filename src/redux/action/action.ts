import axiosInstance from "../../services/axiosInstance";
import { getActionsBySujetFailure, getActionsBySujetRequest, getActionsBySujetSuccess, getEmailsFailure, getEmailsRequest, getEmailsSuccess, updateActionStatusFailure, updateActionStatusRequest, updateActionStatusSuccess } from "./action-slice";
import { GetActionsBySujet, GetEmails, UpdateActionStatus } from "./action-types";

export const getActions: GetActionsBySujet = async (dispatch, sujet_id) => {
    dispatch(getActionsBySujetRequest());
    let url = `/api/action_plan_action/sujets/${sujet_id}/actions`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getActionsBySujetSuccess(response.data));
        return response.data;
    } catch (error) {
        dispatch(getActionsBySujetFailure(error));
        throw error;
    };
}

export const getEmails: GetEmails = async (dispatch) => {
    dispatch(getEmailsRequest());
    let url = `/api/action_plan_action/emails`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getEmailsSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getEmailsFailure(error));
        return false;
    };
}

export const updateActionStatus = async (
  dispatch: any,
  action_id: number,
  status: string,
  options?: {
    comment?: string;
    created_by?: string | null;
    file?: File | null;
  }
) => {
  dispatch(updateActionStatusRequest());

  try {
    const statusPayload = {
      status,
      comment: options?.comment || null,
      created_by: options?.created_by || null,
    };

    const statusResponse = await axiosInstance.put(
      `/api/action_plan_action/actions/${action_id}/status`,
      statusPayload
    );

    let attachmentResponse = null;

    if (options?.file) {
      const formData = new FormData();
      formData.append("file", options.file);

      if (options?.created_by) {
        formData.append("uploaded_by", options.created_by);
      }

      attachmentResponse = await axiosInstance.post(
        `/api/action_plan_action/actions/${action_id}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }

    dispatch(updateActionStatusSuccess(statusResponse.data));
    return {
      action: statusResponse.data,
      attachment: attachmentResponse?.data || null,
    };
  } catch (error) {
    dispatch(updateActionStatusFailure(error));
    return false;
  }
};
export const smartSearchActions = async (query: string) => {
    const url = `/api/action_plan_action/search?query=${encodeURIComponent(query)}`;

    try {
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error("Smart search failed", error);
        return [];
    }
};

export const getActionStatusComments = async (actionId: number) => {
    const url = `/api/action_plan_action/actions/${actionId}/status-comments`;

    const response = await axiosInstance.get(url);
    return response.data;
};

export const getActionAttachments = async (actionId: number) => {
    const url = `/api/action_plan_action/actions/${actionId}/attachments`;

    const response = await axiosInstance.get(url);
    return response.data;
};

export const getActionAttachmentDownloadUrl = (attachmentId: number) => {
    const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

    return `${baseUrl}/api/action_plan_action/attachments/${attachmentId}/download`;
};

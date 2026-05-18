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

export const getActionById = async (actionId: number | string) => {
    const response = await axiosInstance.get(`/api/action_plan_action/actions/${actionId}`);
    return response.data;
};

export const getActionAccess = async (actionId: number | string, email: string) => {
    const params = new URLSearchParams();
    params.set("email", email);

    try {
        const response = await axiosInstance.get(
            `/api/action_plan_action/actions/${actionId}/access?${params.toString()}`
        );
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 403 && error?.response?.data) {
            return error.response.data;
        }

        throw error;
    }
};

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
    const message =
      (error as any)?.response?.data?.detail ||
      (error as any)?.message ||
      "Failed to update action status.";

    throw new Error(message);
  }
};
export const smartSearchActions = async (
    query: string,
    options?: {
        email?: string | null;
        scope?: "my" | "team";
        scopedOnly?: boolean;
    }
) => {
    const params = new URLSearchParams();
    params.set("query", query);

    if (options?.email) {
        params.set("email", options.email);
    }

    if (options?.scope) {
        params.set("scope", options.scope);
    }

    if (options?.scopedOnly && (!options.email || !options.scope)) {
        return [];
    }

    const url = `/api/action_plan_action/search?${params.toString()}`;

    try {
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error("Smart search failed", error);
        return [];
    }
};

export const getFilteredActions = async (options: {
    email?: string | null;
    scope: "my" | "team";
    status: "overdue" | "closed" | "in_progress" | "all";
}) => {
    if (!options.email) {
        return [];
    }

    const params = new URLSearchParams();
    params.set("email", options.email);
    params.set("scope", options.scope);
    params.set("status", options.status);

    const response = await axiosInstance.get(
        `/api/action_plan_action/filtered-actions?${params.toString()}`
    );

    return response.data;
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

const getDownloadFilename = (contentDisposition?: string, fallbackFileName?: string) => {
    if (!contentDisposition) {
        return fallbackFileName || "attachment";
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

    return filenameMatch?.[1] || fallbackFileName || "attachment";
};

const isJsonContentType = (contentType?: string) => (
    String(contentType || "").toLowerCase().includes("application/json")
);

const readJsonBlob = async (blob: Blob) => {
    try {
        const text = await blob.text();

        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};

const openDownloadUrl = (downloadUrl: string, fileName: string) => {
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const normalizeAttachmentDownloadError = async (error: any) => {
    const status = error?.response?.status;
    const responseData = error?.response?.data;
    let detail = error?.response?.data?.detail;

    if (responseData instanceof Blob && isJsonContentType(responseData.type)) {
        const payload = await readJsonBlob(responseData);
        detail = payload?.detail || detail;
    }

    if (status === 404) {
        return new Error("Attachment file not found or legacy file is unavailable.");
    }

    return new Error(detail || error?.message || "Unable to download attachment.");
};

export const downloadActionAttachment = async (
    attachmentId: number,
    fallbackFileName?: string
) => {
    try {
        const response = await axiosInstance.get(
            `/api/action_plan_action/attachments/${attachmentId}/download`,
            { responseType: "blob" }
        );
        const contentType = response.headers["content-type"] || "application/octet-stream";
        const fileName = getDownloadFilename(
            response.headers["content-disposition"],
            fallbackFileName
        );

        if (isJsonContentType(contentType) && response.data instanceof Blob) {
            const payload = await readJsonBlob(response.data);
            const downloadUrl = payload?.download_url;
            const azureFileName = payload?.file_name || fileName;

            if (!downloadUrl) {
                throw new Error("Unable to download attachment.");
            }

            openDownloadUrl(downloadUrl, azureFileName);
            return;
        }

        const blob = response.data instanceof Blob
            ? response.data
            : new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        throw await normalizeAttachmentDownloadError(error);
    }
};

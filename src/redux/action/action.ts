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

export const updateActionStatus: UpdateActionStatus = async (dispatch, action_id, status) => {
    dispatch(updateActionStatusRequest());
    let url = `/api/action_plan_action/actions/${action_id}/status`;
    const data = {
        status: status
    }

    console.log(data);
    try {
        let response = await axiosInstance.put(url, data);
        dispatch(updateActionStatusSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(updateActionStatusFailure(error));
        return false;
    };
}

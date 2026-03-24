import axiosInstance from "../../services/axiosInstance";
import { getActionsBySujetFailure, getActionsBySujetRequest, getActionsBySujetSuccess, getEmailsFailure, getEmailsRequest, getEmailsSuccess } from "./action-slice";
import { GetActionsBySujet, GetEmails } from "./action-types";

export const getActions: GetActionsBySujet = async (dispatch, sujet_id) => {
    dispatch(getActionsBySujetRequest());
    let url = `/api/action_plan_action/sujets/${sujet_id}/actions`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getActionsBySujetSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getActionsBySujetFailure(error));
        return false;
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

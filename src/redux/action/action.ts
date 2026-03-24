import axiosInstance from "../../services/axiosInstance";
import { getActionsBySujetFailure, getActionsBySujetRequest, getActionsBySujetSuccess } from "./action-slice";
import { GetActionsBySujet } from "./action-types";

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

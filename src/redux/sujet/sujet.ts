import axiosInstance from "../../services/axiosInstance";
import { getStatisticsFailure, getStatisticsRequest, getStatisticsSuccess, getSujetsListFailure, getSujetsListRequest, getSujetsListSuccess, getSujetSousSujetsListFailure, getSujetSousSujetsListRequest, getSujetSousSujetsListSuccess, getSujetsRacineListFailure, getSujetsRacineListRequest, getSujetsRacineListSuccess } from "./sujet-slice";
import { GetSujetsListRequestAction, GetSujetSousSujetsListRequestAction, GetSujetsRacineListRequestAction, Statistique } from "./sujet-types";

export const getSujetsList: GetSujetsListRequestAction = async (dispatch) => {
    dispatch(getSujetsListRequest());
    let url = `/api/action_plan_sujet/sujets`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getSujetsListSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getSujetsListFailure(error));
        return false;
    };
}

export const getSujetsRacineList: GetSujetsRacineListRequestAction = async (dispatch, email) => {
    dispatch(getSujetsRacineListRequest());
    let url = `/api/action_plan_sujet/sujets-racine?email=${email || ''}`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getSujetsRacineListSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getSujetsRacineListFailure(error));
        return false;
    };
}

export const getStatistics: Statistique = async (dispatch) => {
    dispatch(getStatisticsRequest());
    let url = `/api/action_plan_action/statistiques`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getStatisticsSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getStatisticsFailure(error));
        return false;
    };
}

export const getSujetSousSujets: GetSujetSousSujetsListRequestAction = async (dispatch, sujet_id) => {
    dispatch(getSujetSousSujetsListRequest());
    let url = `/api/action_plan_sujet/sujets/${sujet_id}/sous-sujets`;
    try {
        let response = await axiosInstance.get(url);
        dispatch(getSujetSousSujetsListSuccess(response.data));
        return true;
    }
    catch (error) {
        dispatch(getSujetSousSujetsListFailure(error));
        return false;
    };
}
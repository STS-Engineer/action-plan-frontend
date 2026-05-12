import axiosInstance from "../../services/axiosInstance";
import {
    getHomeSummaryFailure,
    getHomeSummaryRequest,
    getHomeSummarySuccess,
    getStatisticsFailure,
    getStatisticsRequest,
    getStatisticsSuccess,
    getSujetsListFailure,
    getSujetsListRequest,
    getSujetsListSuccess,
    getSujetSousSujetsListFailure,
    getSujetSousSujetsListRequest,
    getSujetSousSujetsListSuccess,
    getSujetsRacineListFailure,
    getSujetsRacineListRequest,
    getSujetsRacineListSuccess,
} from "./sujet-slice";
import {
    GetHomeSummaryRequestAction,
    GetSujetsListRequestAction,
    GetSujetSousSujetsListRequestAction,
    GetSujetsRacineListRequestAction,
    Statistique,
} from "./sujet-types";

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

export const getSujetsRacineList: GetSujetsRacineListRequestAction = async (
    dispatch,
    email,
    status = null,
) => {
    dispatch(getSujetsRacineListRequest());
    const params = new URLSearchParams();

    if (email) {
        params.set("email", email);
    }

    if (status) {
        params.set("status", status);
    }

    let url = `/api/action_plan_sujet/sujets-racine`;

    if (params.toString()) {
        url = `${url}?${params.toString()}`;
    }

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

export const getHomeSummary: GetHomeSummaryRequestAction = async (
    dispatch,
    email,
    scope,
) => {
    dispatch(getHomeSummaryRequest());

    const params = new URLSearchParams();
    params.set("email", email);
    params.set("scope", scope);

    const url = `/api/action_plan_sujet/home-summary?${params.toString()}`;

    try {
        const response = await axiosInstance.get(url);
        dispatch(getHomeSummarySuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getHomeSummaryFailure(error));
        return false;
    }
}

export const getSujetSousSujets: GetSujetSousSujetsListRequestAction = async (dispatch, sujet_id) => {
    dispatch(getSujetSousSujetsListRequest());
    let url = `/api/action_plan_sujet/sujets/${sujet_id}/sous-sujets`;
    try {
        let response = await axiosInstance.get(url);
        dispatch(getSujetSousSujetsListSuccess(response.data));
        return response.data;
    }
    catch (error) {
        dispatch(getSujetSousSujetsListFailure(error));
        throw error
    };
}
export const getTeamSujetsRacineList = async (
    dispatch: any,
    email: string,
    status: string | null = null,
) => {
    dispatch(getSujetsRacineListRequest());

    const params = new URLSearchParams();

    params.set("email", email);

    if (status) {
        params.set("status", status);
    }

    let url = `/api/action_plan_sujet/team-sujets-racine?${params.toString()}`;

    try {
        let response = await axiosInstance.get(url);
        dispatch(getSujetsRacineListSuccess(response.data));
        return true;
    } catch (error) {
        dispatch(getSujetsRacineListFailure(error));
        return false;
    }
}

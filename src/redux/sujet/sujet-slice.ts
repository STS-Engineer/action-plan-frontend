import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sujet : null,
    sujetsList : [],
    sujetsRacineList : [],
    sujetSousSujets: [],
    statistics: null,
    success: false,
    error: null
}

const sujetSlice = createSlice({
    name : 'sujet',
    initialState,
    reducers: {
        getSujetsListRequest(state) {
            state.success = false;
            state.error = null;
        },
        getSujetsListSuccess(state, action) {
            state.sujetsList = action.payload;
            state.success = true;
        },
        getSujetsListFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        },
        getSujetsRacineListRequest(state) {
            state.success = false;
            state.error = null;
        },
        getSujetsRacineListSuccess(state, action) {
            state.sujetsRacineList = action.payload;
            state.success = true;
        },
        getSujetsRacineListFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        },
        getStatisticsRequest(state) {
            state.success = false;
            state.error = null;
        },
        getStatisticsSuccess(state, action) {
            state.statistics = action.payload;
            state.success = true;
        },
        getStatisticsFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        },
        getSujetSousSujetsListRequest(state) {
            state.success = false;
            state.error = null;
        },
        getSujetSousSujetsListSuccess(state, action) {
            state.sujetSousSujets = action.payload;
            state.success = true;
        },
        getSujetSousSujetsListFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        }
    }
})

export const {
    getSujetsListRequest,
    getSujetsListSuccess,
    getSujetsListFailure,
    getSujetsRacineListRequest,
    getSujetsRacineListSuccess,
    getSujetsRacineListFailure,
    getStatisticsRequest,
    getStatisticsSuccess,
    getStatisticsFailure,
    getSujetSousSujetsListRequest,
    getSujetSousSujetsListSuccess,
    getSujetSousSujetsListFailure
} = sujetSlice.actions;

export default sujetSlice.reducer;
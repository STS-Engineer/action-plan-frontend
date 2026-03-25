import { createSlice } from "@reduxjs/toolkit";
import { ActionState } from "./action-slice-types";

const initialState: ActionState = {
    actionsList : [],
    emailsList : [],
    success: false,
    error: null
}

const actionSlice = createSlice({
    name : 'action',
    initialState,
    reducers: {
        getActionsBySujetRequest(state) {
            state.success = false;
            state.error = null;
        },
        getActionsBySujetSuccess(state, action) {
            state.actionsList = action.payload;
            state.success = true;
        },
        getActionsBySujetFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        },
        getEmailsRequest(state) {
            state.success = false;
            state.error = null;
        },
        getEmailsSuccess(state, action) {
            state.emailsList = action.payload;
            state.success = true;
        },
        getEmailsFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        },
        updateActionStatusRequest(state) {
            state.success = false;
            state.error = null;
        },
        updateActionStatusSuccess(state, action) {
            state.success = true;
            state.actionsList = state.actionsList.map((actionItem: any) => {
                if (actionItem.id === action.payload.id) {
                    return action.payload;
                }
                return actionItem;
            });
        },
        updateActionStatusFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        }
    }
})

export const {
    getActionsBySujetRequest,
    getActionsBySujetSuccess,
    getActionsBySujetFailure,
    getEmailsRequest,
    getEmailsSuccess,
    getEmailsFailure,
    updateActionStatusRequest,
    updateActionStatusSuccess,
    updateActionStatusFailure
} = actionSlice.actions;

export default actionSlice.reducer;
import { configureStore } from "@reduxjs/toolkit";
import sujetReducer from './sujet/sujet-slice';
import actionReducer from './action/action-slice';

export const store = configureStore({
    reducer : {
        sujet: sujetReducer,
        action: actionReducer
    }
})
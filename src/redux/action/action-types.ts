import { Dispatch } from "redux";

export type GetActionsBySujet = (
    dispatch: Dispatch<any>,
    sujet_id: number
) => Promise<boolean>;
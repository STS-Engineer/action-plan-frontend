import { Dispatch } from "redux";

export type GetActionsBySujet = (
    dispatch: Dispatch<any>,
    sujet_id: number
) => Promise<boolean>;

export type GetEmails = (
    dispatch: Dispatch<any>
) => Promise<boolean>;

export type UpdateActionStatus = (
    dispatch: Dispatch<any>,
    action_id: number,
    status: string
) => Promise<boolean>;
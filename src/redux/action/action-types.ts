import { Dispatch } from "redux";

export type GetActionsBySujet = (
    dispatch: Dispatch<any>,
    sujet_id: number,
    options?: {
        email?: string | null,
        scope?: "my" | "team" | "requested_by_me" | "all",
        status?: string | null,
    },
) => Promise<boolean>;

export type GetEmails = (
    dispatch: Dispatch<any>
) => Promise<boolean>;

export type UpdateActionStatus = (
    dispatch: Dispatch<any>,
    action_id: number,
    status: string
) => Promise<boolean>;

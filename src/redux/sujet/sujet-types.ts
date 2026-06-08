import { Dispatch } from "redux";

export type GetSujetsListRequestAction = (
    dispatch: Dispatch<any>
) => Promise<boolean>;

export type GetSujetsRacineListRequestAction = (
    dispatch: Dispatch<any>,
    email: string | null,
    status?: string | null,
    scope?: "my" | "team" | "requested_by_me" | "all",
) => Promise<boolean>;

export type GetHomeSummaryRequestAction = (
    dispatch: Dispatch<any>,
    email: string,
    scope: "my" | "team" | "requested_by_me" | "all",
) => Promise<boolean>;

export type Statistique = (
    dispatch: Dispatch<any>,
) => Promise<boolean>;

export type GetSujetSousSujetsListRequestAction = (
    dispatch: Dispatch<any>,
    sujet_id: number,
    options?: {
        email?: string | null,
        scope?: "my" | "team" | "requested_by_me" | "all",
        status?: string | null,
    },
) => Promise<boolean>;

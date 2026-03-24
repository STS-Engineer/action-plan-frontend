import { Dispatch } from "redux";

export type GetSujetsListRequestAction = (
    dispatch: Dispatch<any>
) => Promise<boolean>;

export type GetSujetsRacineListRequestAction = (
    dispatch: Dispatch<any>,
    email: string | null
) => Promise<boolean>;

export type Statistique = (
    dispatch: Dispatch<any>,
) => Promise<boolean>;

export type GetSujetSousSujetsListRequestAction = (
    dispatch: Dispatch<any>,
    sujet_id: number
) => Promise<boolean>;
export interface SujetState {
    sujetsList : Sujet[],
    sujet: Sujet | null,
    sujetsRacineList: Sujet[],
    sujetSousSujets: Sujet[],
    statistics: Statistics | null,
    success: boolean,
    error: string | null,
}

export interface Sujet {
    description: string | null,
    id: number,
    updated_at: string,
    inserted_by: string | null,
    titre: string,
    parent_sujet_id: number | null,
    code: string,
    created_at: string,
    total_actions: number,
    completed_actions: number,
    overdue_actions: number
}

export interface Statistics {
    total_sujets: number,
    total_actions: number,
    actions_completed: number,
    actions_overdue: number,
    actions_in_progress: number,
    actions_blocked: number
}
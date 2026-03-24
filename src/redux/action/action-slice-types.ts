export interface SujetState {
    actionsList : Action[],
    success: boolean,
    error: string | null,
}

export interface Action {
    parent_action_id: number,
    sujet_id: number,
    titre: string,
    status: string,
    responsable: string,
    due_date: string,
    depth: number,
    updated_at: string,
    type: string,
    id: number,
    description: string,
    priorite: number,
    email_responsable: string | null,
    ordre: number | null,
    created_at: string,
    closed_date: string | null
}
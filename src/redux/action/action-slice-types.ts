export interface ActionState {
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
    demandeur?: string | null,
    email_demandeur?: string | null,
    priority_index?: number | null,
    importance?: string | null,
    urgency?: string | null,
    escalation_level?: number | null,
    ordre: number | null,
    created_at: string,
    closed_date: string | null
}

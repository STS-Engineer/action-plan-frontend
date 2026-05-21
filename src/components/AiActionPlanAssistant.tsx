import { Bot, CheckCircle2, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  chatWithIaAssistant,
  createIaAssistantPlan,
} from "../services/aiActionPlanService";
import type {
  IaAssistantConversationState,
  IaAssistantMessage,
  IaAssistantResponsibleCandidate,
} from "../services/aiActionPlanService";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type AssistantSummary = {
  plan_title?: string | null;
  topics?: string[];
  actions?: string[];
  features?: string[];
  actions_count?: number;
  main_responsible?: string | null;
  main_responsible_email?: string | null;
  responsible_resolution_status?: string | null;
  deadline?: string | null;
  urgency?: string | null;
  sub_actions_included?: boolean;
};

const SUGGESTED_PROMPTS = [
  "Create action plan",
  "Reduce supplier delays",
  "Improve overdue actions",
  "Prepare customer corrective action plan",
  "Build weekly follow-up plan",
];

const MODIFICATION_PROMPTS = [
  "Make it more urgent",
  "Assign it to Taha",
  "Add weekly follow-up",
  "Simplify the plan",
];

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createWelcomeMessages = (): ChatMessage[] => [
  {
    id: createMessageId(),
    role: "assistant",
    text: "Hello, I am IA Assistant. Tell me what you want to improve, and I will ask a few questions before creating anything.",
  },
  {
    id: createMessageId(),
    role: "assistant",
    text: "What problem or objective should this action plan solve?",
  },
];

const toApiMessages = (messages: ChatMessage[]): IaAssistantMessage[] => (
  messages.map((message) => ({
    role: message.role,
    content: message.text,
  }))
);

const getFriendlyError = (error: any) => {
  const status = error?.response?.status;
  const detail = String(error?.response?.data?.detail || error?.message || "");
  const normalized = detail.toLowerCase();

  if (status === 401) {
    return "Your session expired. Please log in again.";
  }

  if (
    status >= 500 ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("openai") ||
    normalized.includes("ai assistant")
  ) {
    return "IA Assistant is temporarily unavailable.";
  }

  if (status === 422 || normalized.includes("validation")) {
    return "IA Assistant could not validate this plan. Please adjust your request and try again.";
  }

  return detail || "IA Assistant is temporarily unavailable.";
};

export function AiActionPlanAssistant({
  open,
  onClose,
  loggedUserEmail,
  scope,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  loggedUserEmail: string | null;
  scope: "my" | "team";
  onCreated: (result: any, draft: any) => Promise<void> | void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [draft, setDraft] = useState<any | null>(null);
  const [summary, setSummary] = useState<AssistantSummary | null>(null);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [conversationState, setConversationState] = useState<IaAssistantConversationState | null>(null);
  const [responsibleCandidates, setResponsibleCandidates] = useState<IaAssistantResponsibleCandidate[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);

  const isWorking = Boolean(loadingText) || requestInFlightRef.current;
  const isReadyForSummary = Boolean(draft && summary);

  const resetConversation = () => {
    setMessages(createWelcomeMessages());
    setInputValue("");
    setDraft(null);
    setSummary(null);
    setLoadingText("");
    setError(null);
    setIsModifying(false);
    setResponsibleCandidates([]);
    setConversationState({
      scope,
      current_step: "objective",
    });
    requestInFlightRef.current = false;
  };

  useEffect(() => {
    if (!open) return;
    resetConversation();
  }, [open, scope]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loadingText, summary]);

  if (!open) return null;

  const appendMessage = (role: ChatMessage["role"], text: string) => {
    const message = {
      id: createMessageId(),
      role,
      text,
    };

    setMessages((current) => [...current, message]);
    return message;
  };

  const sendMessage = async (content: string) => {
    const normalizedContent = content.trim();

    if (!normalizedContent || requestInFlightRef.current || loadingText) return;

    if (!loggedUserEmail) {
      setError("You must be logged in to use IA Assistant.");
      return;
    }

    const userMessage = {
      id: createMessageId(),
      role: "user" as const,
      text: normalizedContent,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputValue("");
    setDraft(null);
    setSummary(null);
    setError(null);
    setIsModifying(false);
    setResponsibleCandidates([]);
    requestInFlightRef.current = true;
    setLoadingText("Analyzing your request...");

    try {
      const response = await chatWithIaAssistant({
        messages: toApiMessages(nextMessages),
        inserted_by: loggedUserEmail,
        scope,
        conversation_state: conversationState,
      });

      appendMessage(
        "assistant",
        response?.reply || "I need a little more information before I can create the plan."
      );

      if (response?.state === "ready_to_create") {
        setDraft(response.draft || null);
        setSummary(response.summary || null);
      }

      if (response?.conversation_state) {
        setConversationState(response.conversation_state);
      }

      setResponsibleCandidates(response?.responsible_candidates || []);

      if (response?.state === "error") {
        setError(response?.reply || "IA Assistant is temporarily unavailable.");
      }
    } catch (err: any) {
      const friendlyMessage = getFriendlyError(err);
      setError(friendlyMessage);
      appendMessage("assistant", friendlyMessage);
    } finally {
      requestInFlightRef.current = false;
      setLoadingText("");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage(inputValue);
  };

  const handleCreate = async () => {
    if (!draft || requestInFlightRef.current || loadingText || !loggedUserEmail) return;

    try {
      setError(null);
      requestInFlightRef.current = true;
      setLoadingText("Creating action plan...");

      const result = await createIaAssistantPlan({
        draft,
        inserted_by: loggedUserEmail,
        scope,
      });

      appendMessage("assistant", "Action plan created successfully.");
      await onCreated(result, draft);
      onClose();
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      requestInFlightRef.current = false;
      setLoadingText("");
    }
  };

  const handleModify = () => {
    setDraft(null);
    setSummary(null);
    setError(null);
    setIsModifying(true);
    setResponsibleCandidates([]);
    appendMessage("assistant", "What would you like me to change?");
  };

  const visibleQuickReplies = isReadyForSummary || isModifying ? MODIFICATION_PROMPTS : SUGGESTED_PROMPTS;

  return (
    <div className="ai-modal-overlay" onClick={isWorking ? undefined : onClose}>
      <section
        className="ai-modal ai-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ai-modal-header ai-chat-header">
          <div className="ai-chat-title-group">
            <div className="ai-chat-icon">
              <Bot size={20} />
            </div>
            <div>
              <h3 id="ai-modal-title">IA Assistant</h3>
              <p>Chat through the plan, review the summary, then create it.</p>
            </div>
          </div>

          <div className="ai-modal-header-actions">
            <button
              type="button"
              className="ai-clear-button"
              onClick={resetConversation}
              disabled={isWorking}
            >
              <Trash2 size={15} />
              Clear
            </button>
            <button
              type="button"
              className="ai-modal-close"
              onClick={onClose}
              disabled={isWorking}
              aria-label="Close IA Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="ai-chat-body">
          <div className="ai-chat-messages">
            {messages.map((message) => (
              <div
                className={`ai-chat-message ${message.role}`}
                key={message.id}
              >
                <div className="ai-chat-bubble">
                  {message.text}
                </div>
              </div>
            ))}

            {loadingText && (
              <div className="ai-chat-message assistant">
                <div className="ai-chat-bubble ai-chat-thinking">
                  <Loader2 size={15} className="ai-spin" />
                  {loadingText}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {summary && (
            <aside className="ai-plan-summary" aria-label="IA Assistant action plan summary">
              <div className="ai-plan-summary-header">
                <Sparkles size={16} />
                <div>
                  <span>Ready to create</span>
                  <strong>{summary.plan_title || "Action plan"}</strong>
                </div>
              </div>

              <div className="ai-plan-stats">
                <span>{summary.topics?.length || 0} topics</span>
                <span>{summary.actions_count || 0} actions</span>
              </div>

              <div className="ai-summary-grid">
                <div>
                  <span>Responsible</span>
                  <strong>
                    {summary.main_responsible || "To confirm"}
                    {summary.main_responsible_email ? (
                      <small>{summary.main_responsible_email}</small>
                    ) : null}
                  </strong>
                </div>
                <div>
                  <span>Deadline</span>
                  <strong>{summary.deadline || "To confirm"}</strong>
                </div>
                <div>
                  <span>Urgency</span>
                  <strong>{summary.urgency || "Normal"}</strong>
                </div>
                <div>
                  <span>Sub-actions</span>
                  <strong>{summary.sub_actions_included ? "Included" : "Not included"}</strong>
                </div>
              </div>

              <div className="ai-summary-section">
                <h4>Features</h4>
                <ul>
                  {(summary.features?.length ? summary.features : ["Standard follow-up"]).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-summary-section">
                <h4>Topics</h4>
                <ul>
                  {(summary.topics || []).slice(0, 8).map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-summary-section">
                <h4>Actions</h4>
                <ul>
                  {(summary.actions || []).slice(0, 10).map((action, index) => (
                    <li key={`${action}-${index}`}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-confirm-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                  disabled={isWorking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleModify}
                  disabled={isWorking}
                >
                  Ask to modify
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleCreate}
                  disabled={isWorking}
                >
                  <CheckCircle2 size={15} />
                  Create action plan
                </button>
              </div>
            </aside>
          )}
        </div>

        {error && (
          <div className="status-modal-error ai-chat-error">
            {error}
          </div>
        )}

        {responsibleCandidates.length > 0 && (
          <div className="ai-candidate-replies">
            {responsibleCandidates.map((candidate) => {
              const label = [
                candidate.display_name || candidate.email || "Unknown",
                candidate.email,
              ].filter(Boolean).join(" - ");

              return (
                <button
                  type="button"
                  key={`${candidate.email || candidate.display_name}`}
                  onClick={() => sendMessage(candidate.email || candidate.display_name || "")}
                  disabled={isWorking}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              className="ai-candidate-none"
              onClick={() => sendMessage("None of these")}
              disabled={isWorking}
            >
              None of these
            </button>
          </div>
        )}

        <div className="ai-quick-replies">
          {visibleQuickReplies.map((reply) => (
            <button
              type="button"
              key={reply}
              onClick={() => sendMessage(reply)}
              disabled={isWorking}
            >
              {reply}
            </button>
          ))}
        </div>

        <form className="ai-chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={
              isReadyForSummary
                ? "Ask IA Assistant to modify the plan..."
                : "Message IA Assistant..."
            }
            disabled={isWorking}
          />
          <button type="submit" disabled={isWorking || !inputValue.trim()}>
            <Send size={16} />
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

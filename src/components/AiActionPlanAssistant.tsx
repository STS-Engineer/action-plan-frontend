import { Bot, CheckCircle2, Loader2, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createAiActionPlan,
  generateAiActionPlanDraft,
} from "../services/aiActionPlanService";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type Question = {
  id: string;
  prompt: string;
  quickReplies: string[];
};

const QUESTIONS: Question[] = [
  {
    id: "problem",
    prompt: "What problem do you want to solve?",
    quickReplies: ["Reduce supplier delays", "Improve quality response", "Launch a weekly follow-up"],
  },
  {
    id: "responsible",
    prompt: "Which department, team, or person should be responsible?",
    quickReplies: ["My team", "Supply chain", "Quality team", "Production"],
  },
  {
    id: "deadline",
    prompt: "What deadline or target date should I plan around?",
    quickReplies: ["This week", "End of month", "30 days", "Next quarter"],
  },
  {
    id: "structure",
    prompt: "Should I create sub-actions and nested topics where useful?",
    quickReplies: ["Add sub-actions", "Keep it simple", "Detailed recursive plan"],
  },
  {
    id: "followup",
    prompt: "Do you want recurring follow-up actions?",
    quickReplies: ["Weekly follow-up", "Daily follow-up", "No recurring follow-up"],
  },
  {
    id: "priority",
    prompt: "Is this urgent, strategic, or a normal priority?",
    quickReplies: ["High priority", "Medium priority", "Urgent", "Strategic"],
  },
  {
    id: "escalation",
    prompt: "Should overdue actions be escalated automatically?",
    quickReplies: ["Escalate if overdue", "No escalation", "Escalate after 7 days"],
  },
];

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const countSujets = (sujets: any[] = []): number => (
  sujets.reduce((total, sujet) => total + 1 + countSujets(sujet.sujets || []), 0)
);

const collectActions = (sujets: any[] = []) => {
  const actions: any[] = [];

  const visitAction = (action: any) => {
    actions.push(action);
    (action.sub_actions || []).forEach(visitAction);
  };

  const visitSujet = (sujet: any) => {
    (sujet.actions || []).forEach(visitAction);
    (sujet.sujets || []).forEach(visitSujet);
  };

  sujets.forEach(visitSujet);
  return actions;
};

const collectSujets = (sujets: any[] = []) => {
  const result: any[] = [];

  const visitSujet = (sujet: any) => {
    result.push(sujet);
    (sujet.sujets || []).forEach(visitSujet);
  };

  sujets.forEach(visitSujet);
  return result;
};

const buildPromptFromAnswers = (
  answers: Record<string, string>,
  scope: "my" | "team"
) => {
  const lines = [
    "Create an enterprise action plan from this conversation.",
    `Scope: ${scope}.`,
    `Problem: ${answers.problem || "Not specified"}.`,
    `Responsible department/team/person: ${answers.responsible || "Not specified"}.`,
    `Deadline: ${answers.deadline || "Not specified"}.`,
    `Structure preference: ${answers.structure || "Not specified"}.`,
    `Follow-up preference: ${answers.followup || "Not specified"}.`,
    `Priority: ${answers.priority || "Not specified"}.`,
    `Escalation preference: ${answers.escalation || "Not specified"}.`,
    answers.modification ? `Requested modifications: ${answers.modification}.` : null,
    "Create clear topics, nested topics when useful, actions, sub-actions, responsables, due dates, urgency, importance, and escalation fields.",
  ].filter(Boolean);

  return lines.join("\n");
};

const getFriendlyError = (error: any) => {
  const detail = String(error?.response?.data?.detail || error?.message || "");

  if (
    error?.response?.status >= 500 ||
    detail.toLowerCase().includes("openai") ||
    detail.toLowerCase().includes("ai")
  ) {
    return "AI assistant temporarily unavailable.";
  }

  return detail || "AI assistant temporarily unavailable.";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [draft, setDraft] = useState<any | null>(null);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];
  const isWorking = Boolean(loadingText);
  const isReadyForSummary = Boolean(draft);
  const isCollectingModification = !draft && questionIndex >= QUESTIONS.length;
  const planActions = useMemo(() => collectActions(draft?.sujets || []), [draft]);
  const planSujets = useMemo(() => collectSujets(draft?.sujets || []), [draft]);

  useEffect(() => {
    if (!open) return;

    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        text: "I can help you build an action plan through a few questions, then I will show you a clear summary before creating anything.",
      },
      {
        id: createMessageId(),
        role: "assistant",
        text: QUESTIONS[0].prompt,
      },
    ]);
    setAnswers({});
    setQuestionIndex(0);
    setInputValue("");
    setDraft(null);
    setLoadingText("");
    setError(null);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loadingText, draft]);

  if (!open) return null;

  const appendMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role,
        text,
      },
    ]);
  };

  const generateDraft = async (nextAnswers: Record<string, string>) => {
    if (!loggedUserEmail) {
      setError("You must be logged in to create an action plan.");
      return;
    }

    try {
      setError(null);
      setLoadingText("Analyzing your request...");

      const generatedDraft = await generateAiActionPlanDraft({
        prompt: buildPromptFromAnswers(nextAnswers, scope),
        inserted_by: loggedUserEmail,
        scope,
      });

      setLoadingText("Generating action structure...");
      setDraft(generatedDraft);
      appendMessage(
        "assistant",
        "I prepared a structured plan. Please review the summary below, then create it or ask me to modify it."
      );
    } catch (err: any) {
      setError(getFriendlyError(err));
      appendMessage("assistant", "I could not generate the plan right now. Please try again in a moment.");
    } finally {
      setLoadingText("");
    }
  };

  const submitAnswer = async (answer: string) => {
    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer || isWorking) return;

    if (isReadyForSummary || isCollectingModification) {
      setDraft(null);
      setError(null);
      appendMessage("user", normalizedAnswer);
      appendMessage("assistant", "Got it. I will revise the plan with that change.");

      const revisedAnswers = {
        ...answers,
        modification: [answers.modification, normalizedAnswer].filter(Boolean).join(" | "),
      };

      setAnswers(revisedAnswers);
      await generateDraft(revisedAnswers);
      return;
    }

    const question = QUESTIONS[questionIndex];
    const nextAnswers = {
      ...answers,
      [question.id]: normalizedAnswer,
    };

    appendMessage("user", normalizedAnswer);
    setAnswers(nextAnswers);
    setInputValue("");

    const nextQuestionIndex = questionIndex + 1;

    if (nextQuestionIndex < QUESTIONS.length) {
      setQuestionIndex(nextQuestionIndex);
      appendMessage("assistant", QUESTIONS[nextQuestionIndex].prompt);
      return;
    }

    await generateDraft(nextAnswers);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitAnswer(inputValue);
  };

  const handleCreate = async () => {
    if (!draft || isWorking) return;

    try {
      setError(null);
      setLoadingText("Creating action plan...");
      const result = await createAiActionPlan(draft);
      appendMessage("assistant", "Done. The action plan has been created and will appear in Home.");
      await onCreated(result, draft);
      onClose();
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoadingText("");
    }
  };

  const handleModify = () => {
    setError(null);
    setDraft(null);
    appendMessage("assistant", "What would you like me to change?");
  };

  const visibleQuickReplies = isReadyForSummary || isCollectingModification
    ? ["Add sub-actions", "Make it urgent", "Add weekly follow-up", "Simplify the plan"]
    : currentQuestion?.quickReplies || [];

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
              <h3 id="ai-modal-title">AI action-plan assistant</h3>
              <p>Answer a few questions, review the summary, then create the plan.</p>
            </div>
          </div>

          <button
            type="button"
            className="ai-modal-close"
            onClick={onClose}
            disabled={isWorking}
            aria-label="Close AI assistant"
          >
            <X size={18} />
          </button>
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

          {draft && (
            <aside className="ai-plan-summary" aria-label="AI action plan summary">
              <div className="ai-plan-summary-header">
                <Sparkles size={16} />
                <div>
                  <span>Ready to create</span>
                  <strong>{draft.plan_title}</strong>
                </div>
              </div>

              <div className="ai-plan-stats">
                <span>{countSujets(draft.sujets)} topics</span>
                <span>{planActions.length} actions</span>
              </div>

              <div className="ai-summary-section">
                <h4>Topics</h4>
                <ul>
                  {planSujets.slice(0, 8).map((sujet: any) => (
                    <li key={`${sujet.code || sujet.titre}-topic`}>{sujet.titre}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-summary-section">
                <h4>Actions</h4>
                <ul>
                  {planActions.slice(0, 10).map((action: any, index: number) => (
                    <li key={`${action.titre}-${index}`}>
                      <span>{action.titre}</span>
                      <small>
                        {[action.responsable, action.due_date, action.urgency]
                          .filter(Boolean)
                          .join(" | ")}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>

              {draft.warnings?.length > 0 && (
                <div className="ai-warning-box">
                  {draft.warnings.map((warning: string) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              )}

              <div className="ai-confirm-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleModify}
                  disabled={isWorking}
                >
                  Modify
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleCreate}
                  disabled={isWorking}
                >
                  <CheckCircle2 size={15} />
                  Create Plan
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

        <div className="ai-quick-replies">
          {visibleQuickReplies.map((reply) => (
            <button
              type="button"
              key={reply}
              onClick={() => submitAnswer(reply)}
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
              isReadyForSummary || isCollectingModification
                ? "Ask for a modification..."
                : "Type your answer..."
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

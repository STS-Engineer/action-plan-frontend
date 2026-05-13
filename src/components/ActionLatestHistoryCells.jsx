import { FileText } from "lucide-react";
import { getActionAttachmentDownloadUrl } from "../redux/action/action";
import "./ActionHistoryModal.css";

const MAX_COMMENT_LENGTH = 80;
const MAX_FILE_NAME_LENGTH = 34;

const shorten = (value, maxLength) => {
  if (!value) return "";

  const normalized = String(value).replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB");
};

export const ActionLatestHistoryCells = ({ action }) => {
  const comment = String(action?.last_status_comment || "").trim();
  const commentBy = action?.last_status_comment_by;
  const commentDate = formatDate(action?.last_status_comment_at);
  const hasComment = comment.length > 0;
  const commentMeta = [
    commentBy ? `by ${commentBy}` : null,
    commentDate ? `on ${commentDate}` : null,
  ].filter(Boolean).join(" ");
  const hasCommentMeta = hasComment && commentMeta;

  const attachmentId = action?.last_attachment_id;
  const attachmentName = action?.last_attachment_name;
  const hasAttachment = Boolean(attachmentId && attachmentName);

  return (
    <>
      <td className="last-comment-cell">
        {hasComment ? (
          <>
            <div className="last-comment-text" title={comment}>
              {shorten(comment, MAX_COMMENT_LENGTH)}
            </div>

            {hasCommentMeta && (
              <div className="last-comment-meta">
                {commentMeta}
              </div>
            )}
          </>
        ) : (
          <span className="empty-table-value">&mdash;</span>
        )}
      </td>

      <td className="attachment-cell">
        {hasAttachment ? (
          <a
            className="attachment-link"
            href={getActionAttachmentDownloadUrl(attachmentId)}
            target="_blank"
            rel="noreferrer"
            title={attachmentName}
            onClick={(event) => event.stopPropagation()}
          >
            <FileText size={14} />
            <span>{shorten(attachmentName, MAX_FILE_NAME_LENGTH)}</span>
          </a>
        ) : (
          <span className="empty-table-value">&mdash;</span>
        )}
      </td>
    </>
  );
};

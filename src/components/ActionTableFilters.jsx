export const createEmptyActionColumnFilters = () => ({
  responsable: "",
  demandeur: "",
  status: "",
  urgency: "",
  importance: "",
  due_date: "",
  priority_index: "",
});

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const includesText = (value, filterValue) => {
  const normalizedFilter = normalize(filterValue);

  if (!normalizedFilter) return true;

  return normalize(value).includes(normalizedFilter);
};

const getFieldValue = (action, field) => {
  if (field === "responsable") {
    return [action?.responsable, action?.email_responsable].filter(Boolean).join(" ");
  }

  if (field === "demandeur") {
    return [action?.demandeur, action?.email_demandeur].filter(Boolean).join(" ");
  }

  if (field === "status") {
    return [action?.canonical_status, action?.status_bucket, action?.status].filter(Boolean).join(" ");
  }

  if (field === "priority_index") {
    return action?.priority_index ?? action?.priorite ?? "";
  }

  return action?.[field] ?? "";
};

export const filterActionsByColumnFilters = (actions, filters) => {
  return (actions || []).filter((action) => {
    return Object.entries(filters || {}).every(([field, filterValue]) =>
      includesText(getFieldValue(action, field), filterValue)
    );
  });
};

export const hasActiveActionColumnFilters = (filters) => {
  return Object.values(filters || {}).some((value) => normalize(value));
};

export const ActionTableFilterControl = ({ field, filters, onChange, placeholder = "Filter" }) => {
  const value = filters?.[field] || "";

  if (field === "status") {
    return (
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="blocked">Blocked</option>
        <option value="overdue">Overdue</option>
        <option value="closed">Closed</option>
      </select>
    );
  }

  if (field === "urgency") {
    return (
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        <option value="">All</option>
        <option value="Urgent">Urgent</option>
        <option value="Flexible">Flexible</option>
        <option value="Secondaire">Secondaire</option>
      </select>
    );
  }

  if (field === "importance") {
    return (
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        <option value="">All</option>
        <option value="Haute">Haute</option>
        <option value="Moyenne">Moyenne</option>
        <option value="Basse">Basse</option>
      </select>
    );
  }

  return (
    <input
      type={field === "due_date" ? "date" : "text"}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(field, event.target.value)}
    />
  );
};

const HIDDEN_CLOSED_DAYS = 7;

const normalizeActionStatus = (status) => (status || '').trim().toLowerCase();

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00`);
};

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const isActionHiddenFromHome = (action, today = getTodayDateOnly()) => {
  const status = normalizeActionStatus(action?.status);
  const closedDate = parseDateOnly(action?.closed_date);

  if (status !== 'closed' || !closedDate) {
    return false;
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - HIDDEN_CLOSED_DAYS);

  return closedDate < cutoff;
};

export const getActionHomeStatusBucket = (action, today = getTodayDateOnly()) => {
  const status = normalizeActionStatus(action?.status);
  const dueDate = parseDateOnly(action?.due_date);

  if (isActionHiddenFromHome(action, today)) {
    return null;
  }

  if (status === 'closed') {
    return 'closed';
  }

  if (status === 'overdue' || status === 'late') {
    return 'overdue';
  }

  if (dueDate && dueDate < today) {
    return 'overdue';
  }

  return 'in_progress';
};

const listeners = new Set();

export const store = {
  user: null,
  managers: [],
  selectedIds: new Set(),
  testOnly: false,
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  listeners.forEach((fn) => fn());
}

export function setUser(user) {
  store.user = user;
  notify();
}

export function clearSelection() {
  store.selectedIds.clear();
  store.testOnly = false;
  notify();
}

export function toggleManager(id, checked) {
  store.testOnly = false;
  if (checked) store.selectedIds.add(id);
  else store.selectedIds.delete(id);
  notify();
}

export function selectAll(ids) {
  store.testOnly = false;
  store.selectedIds = new Set(ids);
  notify();
}

export function setTestOnly(value) {
  store.testOnly = value;
  if (value) store.selectedIds.clear();
  notify();
}

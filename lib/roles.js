export const ROLE_LABELS = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'Administrateur';
}

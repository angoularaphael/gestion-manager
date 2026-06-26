/** Audiences disponibles sur la page Envoyer unifiée. */
export const UNIFIED_AUDIENCES = [
  {
    key: 'managers',
    label: 'Managers',
    api: '/api/managers',
    listKey: 'managers',
    idsKey: 'manager_ids',
    entityKey: 'managers',
    botPath: '/api/send-to-managers',
    emailPath: '/api/managers/send-email',
    hasCountry: true,
    tone: 'blue',
  },
  {
    key: 'promoteurs',
    label: 'Promoteurs',
    api: '/api/promoteurs',
    listKey: 'promoteurs',
    idsKey: 'promoter_ids',
    entityKey: 'promoteurs',
    botPath: '/api/send-to-promoteurs',
    emailPath: '/api/promoteurs/send-email',
    hasCountry: true,
    tone: 'gold',
  },
  {
    key: 'boxeurs',
    label: 'Entraîneurs',
    api: '/api/boxeurs',
    listKey: 'boxeurs',
    idsKey: 'boxeur_ids',
    entityKey: 'boxeurs',
    botPath: '/api/send-to-boxeurs',
    emailPath: '/api/boxeurs/send-email',
    hasCountry: true,
    tone: 'green',
  },
  {
    key: 'clients',
    label: 'Clients',
    api: '/api/clients',
    listKey: 'clients',
    idsKey: 'client_ids',
    entityKey: 'clients',
    botPath: '/api/send-to-clients',
    emailPath: '/api/clients/send-email',
    hasCountry: false,
    tone: 'blue',
  },
  {
    key: 'groupe_chabane',
    label: 'Groupe Chabane',
    api: '/api/groupe-chabane',
    listKey: 'contacts',
    idsKey: 'contact_ids',
    entityKey: 'contacts',
    botPath: '/api/send-to-groupe-chabane',
    emailPath: null,
    hasCountry: false,
    whatsappOnly: true,
    tone: 'gold',
  },
];

export const AUDIENCE_BY_KEY = Object.fromEntries(
  UNIFIED_AUDIENCES.map((a) => [a.key, a])
);

/** Priorité pour éviter les doublons inter-audiences (email / téléphone). */
export const AUDIENCE_DEDUP_ORDER = UNIFIED_AUDIENCES.map((a) => a.key);

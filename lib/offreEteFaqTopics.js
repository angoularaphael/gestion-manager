/** Sujets du formulaire « Ma question n'apparaît pas ? » */
export const OFFRE_ETE_FAQ_TOPICS = [
  { id: 'contact', label: 'Contact et essais' },
  { id: 'membre', label: 'Devenir membre et paiement' },
  { id: 'cours', label: 'Nos cours et programmes' },
  { id: 'resiliation', label: 'Modification et résiliation' },
  { id: 'abonnement', label: 'Inscription et abonnements' },
  { id: 'autre', label: 'Ma question n\'apparaît pas dans la liste' },
];

export function topicLabel(id) {
  return OFFRE_ETE_FAQ_TOPICS.find((t) => t.id === id)?.label || id || 'Question';
}

export function isValidFaqTopic(id) {
  return OFFRE_ETE_FAQ_TOPICS.some((t) => t.id === id);
}

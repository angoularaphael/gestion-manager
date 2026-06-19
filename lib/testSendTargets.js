export function getTestSendEmail() {
  return (
    process.env.CAMPAIGN_TEST_EMAIL ||
    process.env.TEST_SEND_EMAIL ||
    'giffareno237@gmail.com'
  )
    .trim()
    .toLowerCase();
}

export function getTestSendPhone() {
  return (process.env.CAMPAIGN_TEST_PHONE || process.env.TEST_SEND_PHONE || '237693646080').trim();
}

export function getTestContactLabel() {
  const email = getTestSendEmail();
  return email.split('@')[0] || 'test';
}

export function testContactFallback({ prenom = 'Test', nom } = {}) {
  return {
    id: null,
    prenom,
    nom: nom || getTestContactLabel(),
    email: getTestSendEmail(),
    telephone: getTestSendPhone(),
    salle: 'Portet-sur-Garonne',
  };
}

export function testManagerFallback() {
  const row = testContactFallback({ prenom: '', nom: getTestContactLabel() });
  return { nom: row.nom, email: row.email, telephone: row.telephone, id: null };
}

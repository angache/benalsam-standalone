export const generateBoringAvatarUrl = (name, userId) => {
  const cleanedName = name ? String(name).replace(/[^a-zA-Z0-9]/g, '') : '';
  const fallbackName = cleanedName || (userId ? String(userId).substring(0, 8) : 'user');
  return `https://source.boringavatars.com/beam/80/${fallbackName}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`;
};
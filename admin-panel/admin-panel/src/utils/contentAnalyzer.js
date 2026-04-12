// simple content analysis logic used to flag possible spam or inappropriate text
// keeps the admin panel self-contained instead of relying on an external service

export const analyzeContent = async (text) => {
  // Mock analysis logic as per original snippets
  // In a real app, this might call a moderation API
  const spamKeywords = ['buy', 'cheap', 'viagra', 'free', 'win'];
  const inappropriateKeywords = ['hate', 'kill', 'abuse'];
  
  const lowerText = text.toLowerCase();
  const isSpam = spamKeywords.some(kw => lowerText.includes(kw));
  const isInappropriate = inappropriateKeywords.some(kw => lowerText.includes(kw));
  
  return {
    spam: isSpam,
    inappropriate: isInappropriate
  };
};

// Mock translations for testing

export const THOUGHTS = {
  HUNGRY: 'I am hungry',
  TIRED: 'I need rest',
  HAPPY: 'I feel great',
  SAD: 'I am sad',
  WORK: 'Time to work',
  PLAY: 'Let\'s play',
  SHOP: 'I want to buy something',
  SOCIALIZE: 'I should talk to someone',
  LEARN: 'I want to learn',
  BUILD: 'Let\'s build something',
  BLESSED: 'I feel blessed',
  INSPIRED: 'I feel inspired'
};

export const getThought = (key) => {
  return THOUGHTS[key] || 'Thinking...';
};
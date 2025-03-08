// Mock translations for testing

export const THOUGHTS = {
  HUNGRY: 'HUNGRY',
  TIRED: 'TIRED',
  HAPPY: 'HAPPY',
  SAD: 'SAD',
  WORK: 'WORK',
  PLAY: 'PLAY',
  SHOP: 'SHOP',
  SOCIALIZE: 'SOCIALIZE',
  LEARN: 'LEARN',
  BUILD: 'BUILD',
  BLESSED: 'BLESSED',
  INSPIRED: 'INSPIRED'
};

export const getThought = jest.fn().mockReturnValue('TestThought');

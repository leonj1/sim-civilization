// Mock utils for testing

export const generateRandomName = (gender) => {
  return gender === 'male' ? 'TestMaleName' : 'TestFemaleName';
};

export const randomInt = (min, max) => {
  return Math.floor((max - min) / 2) + min; // Return middle value for predictable tests
};

export const sample = (array) => {
  if (!array || array.length === 0) return null;
  return array[0]; // Always return first item for predictable tests
};

export const debugLog = (message, level = 'debug') => {
  // Do nothing in tests
};
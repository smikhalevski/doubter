module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  modulePathIgnorePatterns: ['/lib/'],
  moduleNameMapper: {
    '^doubter$': __dirname + '/src/main',
    '^doubter/(.*)$': __dirname + '/src/main/$1',
  },
};

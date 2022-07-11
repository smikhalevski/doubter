module.exports = {
  rootDir: process.cwd(),
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['/lib/'],
  moduleNameMapper: {
    '^doubter$': __dirname + '/packages/doubter',
    '^@doubter/(.*)$': __dirname + '/packages/$1/src/main',
  },
};

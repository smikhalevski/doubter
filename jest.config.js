module.exports = {
  rootDir: process.cwd(),
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['/lib/'],
  moduleNameMapper: {
    '^valrus$': __dirname + '/packages/valrus',
    '^@valrus/(.*)$': __dirname + '/packages/$1/src/main',
  },
};

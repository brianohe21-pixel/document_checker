module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'application/**/*.ts',
    'infrastructure/hash/**/*.ts',
    'infrastructure/pdf/**/*.ts',
    'infrastructure/blockchain/**/*.ts',
    '!**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@certchain/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};

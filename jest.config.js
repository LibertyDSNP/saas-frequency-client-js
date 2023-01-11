module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverageFrom: ["<rootDir>/src/**/*.{ts}"],
  coveragePathIgnorePatterns: [".swagger.ts", "<rootDir>/src/migrations/V1__create_initial_indices.ts"],
  reporters: ["default", "jest-junit"],
  testMatch: ["<rootDir>/src/**/*.test.(ts)"],
  testEnvironment: "node",
};
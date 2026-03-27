export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest"
  },
  roots: ["<rootDir>/__tests__"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@libs/(.*)\\.js$": "<rootDir>/src/lib/$1",
    "^@libs/(.*)$": "<rootDir>/src/lib/$1"
  },
  testMatch: ["**/*.test.ts"],
  reporters: ["default", "<rootDir>/__tests__/customReporter.js"],
};

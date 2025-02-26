import type { Config } from 'jest';

const config: Config = {
    rootDir: '../',
    moduleFileExtensions: ['ts', 'json', 'js'],
    setupFiles: ['./tests/setup/setup-jest-mock-3rds.ts'],
    testTimeout: 3000,
    preset: 'ts-jest',
    testEnvironment: 'node',
    bail: 1,
    testRegex: '.*\\.test\\.ts$',
    coverageDirectory: './coverage',
    collectCoverageFrom: ['./src/*.{ts,js,jsx}'],
    coverageThreshold: {
        // Disable unit test. Enable once we write test
        global: {
            branches: 0, // The number of the branches of the control structures, like if-then, that have been executed.
            functions: 0, // The number of functions that have been called.
            lines: 0, // The number of lines of source code that have been tested. a Line can have multiply statements e.g. const a = 1; b = 2;
            statements: 0, // The number of statements that have been executed.
        },
    },
};

export default config;

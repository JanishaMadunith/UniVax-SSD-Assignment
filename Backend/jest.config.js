module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/Tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'Controllers/**/*.js',
        'Model/**/*.js',
        'Routes/**/*.js',
        '!node_modules/**'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/Tests/'
    ],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true
};

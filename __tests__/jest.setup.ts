const mockFirebaseAdmin = {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn().mockReturnValue({}),
    },
    database: jest.fn().mockReturnValue({
        ref: jest.fn().mockReturnValue({
            set: jest.fn().mockResolvedValue(true),
            update: jest.fn().mockResolvedValue(true),
            push: jest.fn().mockReturnThis(),
            once: jest.fn().mockResolvedValue({
                val: () => null,
            }),
        }),
    }),
    firestore: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({
            exists: false,
            data: () => ({}),
        }),
    }),
};

jest.mock('firebase-admin', () => {
    return {
        ...mockFirebaseAdmin,
        default: mockFirebaseAdmin,
        __esModule: true,
    };
});

jest.mock('socket.io', () => {
    return {
        Server: jest.fn().mockImplementation(() => {
            return {
                on: jest.fn(),
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            };
        }),
    };
});

jest.mock('@sentry/node', () => {
    return {
        init: jest.fn(),
        captureException: jest.fn(),
        captureMessage: jest.fn(),
        expressRequestHandler: jest.fn(() => (req: any, res: any, next: any) => next()),
        expressErrorHandler: jest.fn(() => (err: any, req: any, res: any, next: any) => next(err)),
        httpIntegration: jest.fn(),
        expressIntegration: jest.fn(),
        setUser: jest.fn(),
        setTag: jest.fn(),
        setExtra: jest.fn(),
        setContext: jest.fn(),
    };
});

jest.mock('@sentry/profiling-node', () => {
    return {
        nodeProfilingIntegration: jest.fn(),
    };
});

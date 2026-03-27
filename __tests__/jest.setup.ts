jest.mock('firebase-admin', () => {
  return {
    __esModule: true,
    default: {
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
    }
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

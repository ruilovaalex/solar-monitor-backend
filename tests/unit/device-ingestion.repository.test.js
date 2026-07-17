const mockTransactionClient = {
  dispositivo: {
    findUnique: jest.fn().mockResolvedValue({ id: "dev-1" }),
  },
};

const mockPrisma = {
  $transaction: jest.fn(async (work) => work(mockTransactionClient)),
  dispositivo: {
    findUnique: jest.fn(),
  },
};

jest.mock("../../src/config/prisma", () => ({ prisma: mockPrisma }));

const { DeviceIngestionRepository } = require("../../src/modules/ingestion/device-ingestion.repository");

describe("DeviceIngestionRepository.transaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("liga todas las operaciones del callback al cliente transaccional", async () => {
    const repository = new DeviceIngestionRepository();

    const result = await repository.transaction(async (transactionRepository) => {
      expect(transactionRepository.client).toBe(mockTransactionClient);
      return transactionRepository.findDevice("dev-1");
    });

    expect(result).toEqual({ id: "dev-1" });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionClient.dispositivo.findUnique).toHaveBeenCalledWith({ where: { id: "dev-1" } });
    expect(mockPrisma.dispositivo.findUnique).not.toHaveBeenCalled();
  });
});

import { HydratedDocument, Model } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export function createUserModelMock(mockUserData: Partial<User>) {
  const mockDocumentInstance: HydratedDocument<User> = {
    ...mockUserData,
    save: jest.fn().mockResolvedValue(mockUserData),
  } as unknown as HydratedDocument<User>;

  const userModelMock: jest.Mock & Partial<Model<User>> = jest
    .fn()
    .mockImplementation(() => mockDocumentInstance);

  userModelMock.findOne = jest.fn().mockResolvedValue(mockUserData);
  userModelMock.findById = jest.fn().mockResolvedValue(mockUserData);
  userModelMock.create = jest.fn().mockResolvedValue(mockDocumentInstance);

  return {
    userModelMock,
    mockDocumentInstance,
  };
}

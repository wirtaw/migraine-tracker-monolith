import { HydratedDocument, Model } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export interface UserModelMock extends jest.Mocked<Partial<Model<User>>> {
  new (data?: Partial<User>): HydratedDocument<User>;
  findOne: jest.MockedFunction<Model<User>['findOne']>;
  findById: jest.MockedFunction<Model<User>['findById']>;
  create: jest.MockedFunction<Model<User>['create']>;
}

interface CreateUserModelMockOptions {
  saveSuccess?: boolean;
  findOneResult?: User | null;
  findByIdResult?: User | null;
  createSuccess?: boolean;
}

export interface UserModelMockResult {
  userModelMock: UserModelMock;
  mockDocumentInstance: HydratedDocument<User>;
}

export function createUserModelMock(
  mockUserData: Partial<User> = {},
  options: CreateUserModelMockOptions = {},
) {
  const {
    saveSuccess = true,
    findOneResult = mockUserData,
    findByIdResult = mockUserData,
    createSuccess = true,
  } = options;

  const mockDocumentInstance: HydratedDocument<User> = {
    ...mockUserData,
    save: jest.fn().mockImplementation(() => {
      if (saveSuccess) {
        return Promise.resolve(mockUserData);
      }
      return Promise.reject(new Error('Save failed'));
    }),
  } as unknown as HydratedDocument<User>;

  const userModelMock: jest.Mock & Partial<Model<User>> = jest
    .fn()
    .mockImplementation(() => mockDocumentInstance);

  userModelMock.findOne = jest.fn().mockImplementation(() => {
    return findOneResult
      ? Promise.resolve(findOneResult)
      : Promise.resolve(null);
  });

  userModelMock.findById = jest.fn().mockImplementation(() => {
    return findByIdResult
      ? Promise.resolve(findByIdResult)
      : Promise.resolve(null);
  });

  userModelMock.findOneAndUpdate = jest.fn().mockImplementation(() => {
    const found = findByIdResult
      ? Promise.resolve(findByIdResult)
      : Promise.resolve(null);

    return { exec: jest.fn().mockResolvedValue(found) };
  });

  userModelMock.create = jest.fn().mockImplementation(() => {
    if (createSuccess) {
      return Promise.resolve(mockDocumentInstance);
    }
    return Promise.reject(new Error('Create failed'));
  });

  return { userModelMock, mockDocumentInstance };
}

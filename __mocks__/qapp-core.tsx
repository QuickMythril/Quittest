import React, { createContext, useContext } from 'react';

type AuthState = {
  address?: string;
  name?: string;
  isLoadingUser?: boolean;
  authenticateUser?: () => Promise<{ address?: string; name?: string }>;
};

type ListsState = {
  fetchResourcesResultsOnly?: (...args: any[]) => Promise<any[]>;
  addNewResources?: (...args: any[]) => void;
  updateNewResources?: (...args: any[]) => void;
  deleteResource?: (...args: any[]) => Promise<boolean>;
};

type IdentifierOperations = {
  buildSearchPrefix?: (...args: any[]) => Promise<string>;
  buildLooseSearchPrefix?: (...args: any[]) => Promise<string>;
  buildIdentifier?: (...args: any[]) => Promise<string>;
  createSingleIdentifier?: (...args: any[]) => Promise<string>;
  hashString?: (...args: any[]) => Promise<string>;
};

type MockContext = {
  auth: AuthState;
  lists: ListsState;
  identifierOperations: IdentifierOperations;
};

const defaultAuth: AuthState = {
  address: undefined,
  name: undefined,
  isLoadingUser: false,
  authenticateUser: async () => ({ address: 'ADDR', name: 'testname' }),
};

const defaultLists: ListsState = {
  fetchResourcesResultsOnly: async () => [],
  addNewResources: () => {},
  updateNewResources: () => {},
  deleteResource: async () => true,
};

const defaultIdentifiers: IdentifierOperations = {
  buildSearchPrefix: async () => 'prefix-',
  buildLooseSearchPrefix: async () => 'loose-',
  buildIdentifier: async () => 'identifier',
  createSingleIdentifier: async (id) => `app_${id}`,
  hashString: async (str: string) => `hash_${str}`,
};

const MockGlobalContext = createContext<MockContext>({
  auth: defaultAuth,
  lists: defaultLists,
  identifierOperations: defaultIdentifiers,
});

export const GlobalProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: Partial<MockContext>;
}) => {
  const contextValue: MockContext = {
    auth: { ...defaultAuth, ...(value?.auth || {}) },
    lists: { ...defaultLists, ...(value?.lists || {}) },
    identifierOperations: {
      ...defaultIdentifiers,
      ...(value?.identifierOperations || {}),
    },
  };
  return (
    <MockGlobalContext.Provider value={contextValue}>
      {children}
    </MockGlobalContext.Provider>
  );
};

export const useGlobal = () => {
  return useContext(MockGlobalContext);
};

// Toast helpers
export const showError = jest.fn((msg?: string) => msg);
export const showSuccess = jest.fn((msg?: string) => msg);
export const showLoading = jest.fn((msg?: string) => `loading-${msg || ''}`);
export const dismissToast = jest.fn();

// Publish helpers
export const usePublish = () => ({
  publishMultipleResources: jest.fn(async () => {}),
  updatePublish: jest.fn(),
});

// Balance
export const useQortBalance = () => ({ value: 1 });

// Auth hook (for switchName, etc.)
export const useAuth = () => ({
  switchName: jest.fn(),
});

// Types re-export stubs
export type Service = any;
export type LoaderListStatus = 'LOADING' | 'ERROR' | 'NO_RESULTS';

// Components that are used in tests but not implemented here
export const ResourceListDisplay = () => null;
export const LoaderListStatus = {} as any;
export const LoaderListStatusEnum = {} as any;

// Utility stubs
export const objectToBase64 = async (obj: any) =>
  Buffer.from(JSON.stringify(obj)).toString('base64');

import type { ReactNode } from 'react';
import type { Web3ModalConfig } from '../hooks/useWeb3Modal';
import { createContext, useContext, useEffect } from 'react';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { useAppReducer } from './reducer';

// Custom hooks
import { useWeb3Modal } from '../hooks/useWeb3Modal';
import { useRpcProvider } from '../hooks/useRpcProvider';
import { useNetworkId } from '../hooks/useNetworkId';
import { useAccount } from '../hooks/useAccount';
import { useWeb3StorageApi } from '../hooks/useWeb3StorageApi';
import { useSmartContractData } from '../hooks/useSmartContractData';
import { useOwnFacilities } from '../hooks/useOwnFacilities';

// Config
import { getNetwork } from '../config';

// Initialize logger
// const logger = Logger('Store');

export type AppReducerType = ReturnType<typeof useAppReducer>;
export type State = AppReducerType[0];
export type Dispatch = AppReducerType[1];

export const StateContext = createContext<State | null>(null);
export const DispatchContext = createContext<Dispatch | null>(null);

export interface PropsType {
  children: ReactNode;
}

export const useAppState = () => {
  const ctx = useContext(StateContext);

  if (!ctx) {
    throw new Error('Missing state context');
  }

  return ctx;
};

export const useAppDispatch = () => {
  const ctx = useContext(DispatchContext);

  if (!ctx) {
    throw new Error('Missing dispatch context');
  }

  return ctx;
}

const { chainId, rpc } = getNetwork();

// Web3Modal initialization
const web3ModalConfig: Web3ModalConfig = {
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        [chainId]: rpc
      }
    }
  }
};

export const AppStateProvider = ({ children }: PropsType) => {
  const [state, dispatch] = useAppReducer();
  const [rpcProvider, rpcProviderError] = useRpcProvider();
  const [
    provider,
    injectedProvider,
    isConnecting,
    signIn,
    signOut,
    web3ModalError
  ] = useWeb3Modal(web3ModalConfig);
  const [
    networkId,
    isNetworkIdLoading,
    isRightNetwork,
    networkError
  ] = useNetworkId(provider, chainId);
  const [account, isAccountLoading, accountError] = useAccount(provider);
  const ipfsNode = useWeb3StorageApi();
  const { bootstrapped, ownFacilitiesBootstrapped } = state;

  // Global data bootstrap
  const [bootstrapError] = useSmartContractData(
    dispatch,
    rpcProvider,
    ipfsNode,
    bootstrapped
  );

  // Own facilities bootstrap
  const [ownFacilitiesError, ownFacilitiesRefresh] = useOwnFacilities(
    dispatch,
    account,
    provider,
    ipfsNode,
    ownFacilitiesBootstrapped
  );

  useEffect(
    () => {
      dispatch({
        type: 'SET_OWN_FACILITIES_REFRESH',
        payload: ownFacilitiesRefresh
      });
    },
    [dispatch, ownFacilitiesRefresh]
  );

  useEffect(() => {
    if (web3ModalError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: web3ModalError
      })
    }
    if (networkError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: networkError
      })
    }
    if (accountError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: accountError
      })
    }
    if (bootstrapError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: bootstrapError
      })
    }
    if (rpcProviderError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: rpcProviderError
      })
    }
    if (ownFacilitiesError) {
      dispatch({
        type: 'ERROR_ADD',
        payload: ownFacilitiesError
      })
    }
  }, [
    dispatch, web3ModalError, networkError,
    accountError, bootstrapError,
    rpcProviderError, ownFacilitiesError
  ]);

  useEffect(() => {
    dispatch({
      type: 'SET_CONNECTING',
      payload: isConnecting || isNetworkIdLoading || isAccountLoading
    })
  }, [dispatch, isConnecting, isNetworkIdLoading, isAccountLoading]);

  useEffect(() => {
    dispatch({
      type: 'SET_ACCOUNT',
      payload: account
    })
  }, [dispatch, account]);

  useEffect(() => {
    dispatch({
      type: 'SET_IS_RIGHT_NETWORK',
      payload: isRightNetwork
    })
  }, [dispatch, isRightNetwork]);

  useEffect(() => {
    dispatch({
      type: 'SET_NETWORK_ID',
      payload: networkId
    })
  }, [dispatch, networkId]);

  useEffect(() => {
    dispatch({
      type: 'SET_PROVIDER',
      payload: provider
    })
  }, [dispatch, provider]);

  useEffect(() => {
    dispatch({
      type: 'SET_INJECTED_PROVIDER',
      payload: injectedProvider
    })
  }, [dispatch, injectedProvider]);

  useEffect(() => {
    dispatch({
      type: 'SET_RPC_PROVIDER',
      payload: rpcProvider
    })
  }, [dispatch, rpcProvider]);

  useEffect(() => {
    dispatch({
      type: 'SET_WEB3MODAL_FUNCTIONS',
      payload: {
        signIn,
        signOut
      }
    })
  }, [dispatch, signIn, signOut]);

  useEffect(() => {
    dispatch({
      type: 'SET_IPFS_NODE',
      payload: ipfsNode
    })
  }, [dispatch, ipfsNode]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

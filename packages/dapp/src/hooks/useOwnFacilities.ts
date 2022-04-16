import type { providers } from 'ethers';
import type { Web3StorageApi } from '@windingtree/ipfs-apis';
import type { Contract, StayTokenState } from 'stays-core';
import type { OwnerSpace, OwnerLodgingFacility } from '../store/actions';
import type { Dispatch } from '../store';
import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';
import Logger from '../utils/logger';

// Initialize logger
const logger = Logger('useOwnFacilities');

export type UseOwnFacilitiesHook = [
  error: string | undefined,
  refresh: () => Promise<void>
];

// Helper for tokens data loading
const loadTokens = async (
  contract: Contract,
  spaceId: string,
  state: StayTokenState
): Promise<OwnerSpace | null> => {
  try {
    const states: StayTokenState[] = [0, 1, 2]
    const tokenIds = await Promise.all(
      states.map((s) => contract.getTokensBySpaceId(spaceId, s))
    )

    const flattenTokenIds = tokenIds.reduce((a, b) => a.concat(b), []);
    const space = await contract.getSpace(spaceId);
    const tokens = await Promise.all(
      flattenTokenIds.map((t) => contract.getToken(t))
    )

    logger.debug('Loaded space:', spaceId, flattenTokenIds);

    if (space === null) {
      logger.error(`Space with Id: ${spaceId} not found`);
      return null;
    }

    return {
      ...space,
      spaceId,
      tokens
    };
  } catch(_) {
    return null;
  }
}

export const useOwnFacilities = (
  dispatch: Dispatch,
  account?: string,
  provider?: providers.JsonRpcProvider,
  ipfsNode?: Web3StorageApi,
  ownFacilitiesBootstrapped?: boolean
): UseOwnFacilitiesHook => {
  const [contract,, contractError] = useContract(provider, ipfsNode);
  const [error, setError] = useState<string | undefined>(undefined);

  // Loading state helper
  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch({
        type: 'SET_OWN_FACILITIES_LOADING',
        payload: isLoading
      });
    },
    [dispatch]
  );

  // Load facilities with spaces and tokens
  const loadFacilities = useCallback(
    async (account: string | undefined) => {
      if (!contract || !account) {
        return;
      }

      try {
        setLoading(true);
        const facilityIds = await contract.getLodgingFacilityIdsByOwner(account);
        logger.debug('Facilities Ids:', facilityIds);

        let ownFacilities = await Promise.all(
          facilityIds.map(
            async (facilityId): Promise<OwnerLodgingFacility | null> => {
              const facility = await contract.getLodgingFacility(facilityId);
              logger.debug('Loaded facility:', facilityId, facility);

              if (facility === null) {
                logger.error(
                  `Lodging facility with Id: ${facilityId} not found`
                );
                return null;
              }

              const spaceIds = await contract.getSpaceIds(facilityId, true);
              logger.debug('Spaces Ids:', facilityId, spaceIds);

              let spaces = await Promise.all(
                spaceIds.map(
                  async spaceId => loadTokens(contract, spaceId, 1)
                )
              );
              spaces = spaces.filter(t => t !== null);

              return {
                ...facility,
                spaces: spaces as OwnerSpace[]
              };
            }
          )
        );
        ownFacilities = ownFacilities.filter(f => f !== null);

        // Set own facilities state
        dispatch({
          type: 'SET_OWN_FACILITIES',
          payload: ownFacilities as OwnerLodgingFacility[]
        });
        setLoading(false);
      } catch (err) {
        logger.debug('loadFacilities', err);
        setError(
          (err as Error).message || 'Unknown own facilities loader error'
        );
        setLoading(false);
      }
    },
    [dispatch, setLoading, contract]
  );

  const refresh = useCallback(
    () => loadFacilities(account),
    [loadFacilities, account]
  );

  useEffect(
    () => {
      if (contractError !== undefined) {
        logger.debug('contractError', contractError);
        dispatch({
          type: 'ERROR_ADD',
          payload: contractError
        });
      }
    },
    [dispatch, contractError]
  );

  useEffect(
    () => {
      if (!account) {
        // reset own facilities state
        dispatch({
          type: 'RESET_OWN_FACILITIES'
        });
        return;
      }

      if (ownFacilitiesBootstrapped) {
        // Already bootstrapped, just ignore the action
        return;
      }

      // Fetching of own facilities
      loadFacilities(account);
    },
    [dispatch, loadFacilities, account, ownFacilitiesBootstrapped]
  );

  return [error, refresh];
};

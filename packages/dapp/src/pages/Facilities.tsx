import type { LodgingFacilityRecord, OwnerLodgingFacility, OwnerSpace } from '../store/actions';
import { useContext, useMemo, useState } from 'react';
import { Box, Button, ResponsiveContext, Spinner, Tab, Tabs, Text } from 'grommet';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageWrapper } from './PageWrapper';
import { MessageBox } from '../components/MessageBox';
import { useAppState } from '../store';
import { CheckOutView } from '../components/checkOut/CheckOutView';
import { useCheckOut } from '../hooks/useCheckOut';
import { AddCircle, Edit } from 'grommet-icons';
import styled from 'styled-components';
import { DateTime } from 'luxon';
import { TxHashCallbackFn } from 'stays-core/dist/src/utils/sendHelper';
import { providers } from 'ethers'
const CustomText = styled(Text)`
  color: #0D0E0F;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 24px;
  text-align: start;
`;

// const ResponsiveColumn = (winWidth: number): string[] => {
//   if (winWidth >= 1300) {
//     return ["21rem", "21rem"];
//   } else if (winWidth >= 1000) {
//     return ["21rem", "21rem"];
//   } else if (winWidth >= 768) {
//     return ["21rem"];
//   } else if (winWidth >= 600) {
//     return ["31rem"];
//   } else if (winWidth <= 500) {
//     return ["24rem"];
//   } else if (winWidth <= 400) {
//     return ["16rem"];
//   }
//   return [];
// };

const FacilityList: React.FC<{
  selectedFacilityId: string | undefined,
  facilities: OwnerLodgingFacility[],
}> = ({ selectedFacilityId, facilities, children }) => {
  const navigate = useNavigate();
  const tabIndex = useMemo(() => {
    return facilities.findIndex(el => el.contractData.lodgingFacilityId === selectedFacilityId)
  }, [selectedFacilityId, facilities])

  if (!facilities) {
    return null
  }

  return <Tabs activeIndex={tabIndex} margin={{ top: 'large' }}>
    {facilities.map((facility, i) => (
      <Tab
        onClick={() => {
          const query = new URLSearchParams([
            ['facilityId', String(facility.contractData.lodgingFacilityId)],
          ]);
          navigate(`/facilities?${query}`, { replace: true });
        }}
        key={i}
        title={<CustomText>{facility.name}</CustomText>}
      >
        {children}
      </Tab>
    ))}
    <Tab onClick={() => navigate('/facilities/add')} icon={<AddCircle size='medium' radius='large' />} />
  </Tabs>
}

const SpacesList: React.FC<{
  ownerFacility: OwnerLodgingFacility | undefined,
  checkOut: (
    tokenId: string,
    checkOutDate: DateTime,
    transactionHashCb?: TxHashCallbackFn
  ) => void,
  loading: boolean,
  error: string | undefined,
  provider: providers.Web3Provider | undefined,
  facility: LodgingFacilityRecord
}> = ({ ownerFacility, checkOut, loading, error, provider, facility }) => {
  const navigate = useNavigate();
  const [showTokens, setShowTokens] = useState<string>()
  if (!ownerFacility || !ownerFacility.spaces) {
    return null
  }

  return (
    <Box direction='column'>
      {ownerFacility.spaces.map((space: OwnerSpace, i) => (
        <Box
          key={i}
          border='bottom'
          pad='medium'
        >
          <Box
            key={i}
            direction='row'
            align='center'
            width='100%'
          >
            <Box
              // pad='medium'
              width='100%'
              onClick={() => setShowTokens(space.spaceId)}
            >
              <CustomText>{space.name}</CustomText>
            </Box>
            <Box>
              <Button
                icon={<Edit size='medium' radius='large' />}
                onClick={() => navigate(
                  `/spaces/edit/${ownerFacility.contractData.lodgingFacilityId}/${space.spaceId}`
                )}
              />
            </Box>
          </Box>
          {showTokens === space.spaceId &&
            <Box>
              {space.tokens.length > 0 ? space.tokens.map((token, index) => (
                <CheckOutView
                  key={index}
                  facilityOwner={ownerFacility.contractData.owner}
                  checkOut={checkOut}
                  facility={facility}
                  error={error}
                  loading={loading}
                  {...token}
                  provider={provider}
                  onClose={() => setShowTokens('undefined')}
                />
              )) :
                <Box pad='medium'>
                  <Text>No tokens in this space</Text>
                </Box>
              }
            </Box>
          }
        </Box>
      ))}
    </Box>
  );
}

export const Facilities = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const size = useContext(ResponsiveContext);

  const {
    account,
    ownFacilities,
    ownFacilitiesLoading,
    provider,
    ipfsNode,
    lodgingFacilities
  } = useAppState();

  const [checkOut, isReady, checkOutLoading, checkOutError] = useCheckOut(
    account,
    provider,
    ipfsNode,
  );

  const ownerFacility = useMemo(() => {
    const params = new URLSearchParams(search)
    const facilityId = params.get('facilityId')
    console.log('useMemo', facilityId, ownFacilities)
    return ownFacilities?.find(f => f.contractData.lodgingFacilityId === facilityId)
  }, [search, ownFacilities]);

  const facility = useMemo(() => {
    const params = new URLSearchParams(search)
    const facilityId = params.get('facilityId')
    return lodgingFacilities.find(f => f.contractData.lodgingFacilityId === facilityId)
  }, [search, lodgingFacilities]);


  return (
    <PageWrapper
      breadcrumbs={[
        {
          path: '/',
          label: 'Home'
        }
      ]}
    >
      <MessageBox type='info' show={!!ownFacilitiesLoading}>
        <Box direction='row'>
          <Box>
            The Dapp is synchronizing with the smart contract. Please wait..&nbsp;
          </Box>
          <Spinner />
        </Box>
      </MessageBox>

      <FacilityList
        selectedFacilityId={ownerFacility?.contractData.lodgingFacilityId}
        facilities={ownFacilities ?? []}
      >

        <Box
          pad={size}
          direction='column'
        >
          {ownerFacility &&
            <>
              <Box direction='row' align='center' margin={{ top: 'small', bottom: 'small' }}>
                <CustomText>{ownerFacility.name}</CustomText>
                <Button
                  icon={<Edit size='medium' radius='large' />}
                  onClick={() => navigate(
                    `/facilities/edit/${ownerFacility.contractData.lodgingFacilityId}`
                  )}
                />
              </Box>

              <Box direction='row' align='center' margin={{ top: 'small', bottom: 'small' }}>
                <CustomText>Spaces</CustomText>
                {ownerFacility &&
                  <Button
                    icon={<AddCircle size='medium' radius='large' />}
                    onClick={() => navigate(
                      `/spaces/add/${ownerFacility.contractData.lodgingFacilityId}`
                    )}
                  />
                }
              </Box>
            </>
          }

          {isReady && facility !== undefined &&
            <SpacesList
              checkOut={checkOut}
              error={checkOutError}
              loading={checkOutLoading}
              ownerFacility={ownerFacility}
              provider={provider}
              facility={facility}
            />
          }
        </Box>
      </FacilityList>
    </PageWrapper>
  );
};

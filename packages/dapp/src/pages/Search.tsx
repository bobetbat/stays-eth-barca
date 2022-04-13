import { PageWrapper } from './PageWrapper';
import { SearchForm } from '../components/search/SearchForm';
import { Box, Spinner, Text } from 'grommet';
import { SearchResultCard } from '../components/SearchResultCard';
import { useAppState } from '../store';
import { useSpaceSearch } from '../hooks/useSpaceSearch';
import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageBox } from '../components/MessageBox';
import { GradientText } from './Home';
import styled from 'styled-components';

export const WhiteParagraph = styled(Text)`
  text-align: start;
  align-self: center;
  color: #fff;
  font-family: Inter;
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  letter-spacing: 0px;
  max-width: 50rem;
  margin-top: 5rem;
`;

export const WhiteParagraph18 = styled(Text)`
  text-align: start;
  align-self: center;
  color: #fff;
  font-family: Inter;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0px;
  max-width: 50rem;
  margin-top: 2rem;
`;

export const Search = () => {
  console.log("Search :: start")

  const { searchSpaces } = useAppState();
  const { search } = useLocation();
  const [afterLoading, setAfterLoading] = useState(false);

  const { startDay, numberOfDays, roomsNumber } = useMemo(() => {
    const params = new URLSearchParams(search);
    const startDay = Number(params.get('startDay'));
    const numberOfDays = Number(params.get('numberOfDays'));
    const roomsNumber = Number(params.get('roomsNumber'));
    return {
      startDay,
      numberOfDays,
      roomsNumber
    }
  }, [search])

  const [loading, error] = useSpaceSearch(startDay, numberOfDays, roomsNumber);

  useEffect(
    () => {
      if (!loading) {
        setTimeout(() => setAfterLoading(false), 3000);
      } else {
        setAfterLoading(true);
      }
    },
    [loading]
  );

  console.log("Search :: end")
  const filteredSpaces = useMemo(() => {
    if (
      (!searchSpaces || !searchSpaces.length) ||
      (roomsNumber === 0)
    ) {
      return [];
    }

    return searchSpaces.filter((space: any) => space.available >= roomsNumber);
  }, [searchSpaces, roomsNumber])

  return (
    <PageWrapper>

      <Box align='center' margin={{ bottom: 'small' }}>
        <Text size='xxlarge'>
          April 17-25 2022
        </Text>
        <Text size='large'>
          Devconnect APRIL 17-25, 2022 Amsterdam, The Netherlands
        </Text>
        <GradientText>Amsterdam</GradientText>
      </Box>

      <Box margin={{ bottom: 'medium' }}>
        <SearchForm
          startDay={startDay}
          numberOfDays={numberOfDays}
          initroomsNumber={roomsNumber}
        />
      </Box>

      <MessageBox type='error' show={!!error}>
        <Box direction='row'>
          <Box>
            {error}
          </Box>
        </Box>
      </MessageBox>

      {afterLoading ? <Spinner color='accent-1' alignSelf='center' size='large' /> : null}

      <MessageBox type='info' show={!afterLoading && filteredSpaces.length === 0}>
        <Text>
          No spaces found according your criteria
        </Text>
      </MessageBox>

      <Box margin={{ top: 'large' }}>
        {filteredSpaces.map((space) =>
          <SearchResultCard
            key={space.contractData.spaceId}
            space={space}
            numberOfDays={numberOfDays}
            roomsNumber={roomsNumber}
          />
        )}
      </Box>
    </PageWrapper>
  );
};

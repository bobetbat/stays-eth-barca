import { useMemo } from 'react';
import { Box, Spinner, Text } from 'grommet';
import { useAppState } from '../store';
import { PageWrapper } from '../pages/PageWrapper';
import { MessageBox } from '../components/MessageBox';
import { SearchForm } from '../components/search/SearchForm';
import styled from 'styled-components';

export const GradientText = styled(Text)`
  font-size: 3em;
  line-height: 1.36em;
  font-weight: 900;
  text-align: center;
  font-family: Inter;
  background: linear-gradient(to right, #68bab7, #cc0033, #be8747, #c5393f, #5312a8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const Home = () => {
  const {
    isIpfsNodeConnecting,
    isBootstrapLoading,
    bootstrapped,
    getDate
  } = useAppState();

  const isReady = useMemo(
    () => !isIpfsNodeConnecting && !isBootstrapLoading && getDate !== undefined,
    [isIpfsNodeConnecting, isBootstrapLoading, getDate]
  );

  return (
    <PageWrapper>
      <Box align='center' margin={{ bottom: 'large', top: 'large' }}>
        <GradientText>Book Hotels On Gnosis Chain with up to 50% discount. Pay in xDai. Check-in with NFT. Stay&nbsp;for&nbsp;<a href="https://www.iamsterdam.com/en/see-and-do/whats-on/major-events-and-celebrations/kings-day">King's Day</a> (April 27).</GradientText>
      </Box>

      {(isIpfsNodeConnecting || isBootstrapLoading) &&
        <Spinner color='accent-2' alignSelf='center' size='large' margin={{ top: 'large' }} />
      }

      <MessageBox type='error' show={isReady && !!!bootstrapped}>
        <Text>
          💔 Uh-oh... The app couldn't sync with the smart contract. Try refreshing the page? 💔
        </Text>
      </MessageBox>

      {isReady && !!bootstrapped &&
        <SearchForm />
      }
    </PageWrapper>
  );
};

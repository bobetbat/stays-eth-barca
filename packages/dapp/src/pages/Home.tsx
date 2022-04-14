import { useMemo } from 'react';
import { Box, Spinner, Text } from 'grommet';
import { useAppState } from '../store';
import { PageWrapper } from '../pages/PageWrapper';
import { MessageBox } from '../components/MessageBox';
import { SearchForm } from '../components/search/SearchForm';
import styled from 'styled-components';

export const GradientText = styled(Text)`
  font-family: Inter;
  font-size: 4em;
  line-height: 1.2em;
  font-weight: 900;
  text-align: center;
  background: linear-gradient(to right, #68bab7, #84e488, #be8747, #c5393f, #5312a8);
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
      <Box align='center' margin='large'>
        <GradientText>Book Hotels On Gnosis Chain with up to 50% discount. Pay in xDai. Check-in with NFT.</GradientText>
      </Box>

      <MessageBox type='info' show={isIpfsNodeConnecting || isBootstrapLoading}>
        <Box direction='row'>
          <Box margin={{ right: 'small' }}>
            🙀 Your Experience is Loading 🙀
          </Box>
          <Spinner />
        </Box>
      </MessageBox>

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

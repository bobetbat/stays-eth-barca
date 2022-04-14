import { DateTime } from 'luxon';
import { Box, TextInput, DateInput } from 'grommet';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components';
import { useAppState } from '../../store';
import { WhiteButton } from '../buttons';

export const Label = styled.div`
  @include g-font($g-fontsize-xs,$glider-color-text-labels,$g-fontweight-normal);
  margin-left: 4px;
`;

export const RoomsNumber = styled(TextInput)`
  height: 2.5rem;
  background: white;
  color: black;
  border: 1px solid black;
  border-radius: 2.5rem;
  &:hover,&:active {
    box-shadow: 0px 0px 0px 2px black;
  }
  -moz-appearance: textfield;
  -webkit-appearance: none;
`;

export const parseDateToDays = (dayZero: DateTime, firstDate: DateTime, secondDate: DateTime) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const startDay = Math.round(firstDate.diff(dayZero).toMillis() / oneDay)
  const numberOfDays = Math.round(secondDate.diff(firstDate).toMillis() / oneDay)
  return {
    startDay,
    numberOfDays
  }
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const today = DateTime.now().set({ hour: 12 });
const tomorrow = today.plus({ days: 1 });
const defaultStartDay = DateTime.fromISO('2022-04-17').set({ hour: 12 });
const defaultEndDay = DateTime.fromISO('2022-04-25').set({ hour: 12 });

const defaultStartDate = today.toMillis() > defaultStartDay.toMillis() ? today.toISO() : defaultStartDay.toISO()
const defaultEndDate = tomorrow.toMillis() > defaultEndDay.toMillis() ? tomorrow.toISO() : defaultEndDay.toISO()

export const SearchForm: React.FC<{
  startDay?: number | undefined,
  numberOfDays?: number | undefined,
  initRoomsNumber?: number | undefined,
}> = ({ startDay, numberOfDays, initRoomsNumber }) => {
  const navigate = useNavigate();
  const { getDate } = useAppState();
  const [departureDate, setDepartureDate] = useState<string>(defaultStartDate);
  const [returnDate, setReturnDate] = useState<string>(defaultEndDate);
  const [roomsNumber, setroomsNumber] = useState<number>(initRoomsNumber ?? 1);

  useEffect(() => {
    if (getDate !== undefined && !!startDay && !!numberOfDays) {
      const departureDay = getDate(startDay);
      const returnDay = getDate(startDay + numberOfDays);

      setDepartureDate(departureDay.toISO());
      setReturnDate(returnDay.toISO());
    }
  }, [getDate, startDay, numberOfDays]);

  const handleDateChange = ({ value }: { value: string[] }) => {
    const now = DateTime.now().set({ hour: 12 })
    const tomorrow = now.plus({ days: 1 })

    if (now.toMillis() > DateTime.fromISO(value[0]).toMillis()) {
      setDepartureDate(now.toISO())
    } else {
      setDepartureDate(value[0])
    }

    if (tomorrow.toMillis() > DateTime.fromISO(value[1]).toMillis()) {
      setReturnDate(tomorrow.toISO())
    } else {
      setReturnDate(value[1])
    }
  }

  const handleSearch = useCallback(
    () => {
      if (getDate === undefined) {
        return () => {};
      }
      const { startDay, numberOfDays } = parseDateToDays(
        getDate(0),
        DateTime.fromISO(departureDate),
        DateTime.fromISO(returnDate)
      );
      const query = new URLSearchParams([
        ['startDay', String(startDay)],
        ['numberOfDays', String(numberOfDays)],
        ['roomsNumber', String(roomsNumber)],
      ]);
      navigate(`/search?${query}`, { replace: true });
    },
    [navigate, getDate, departureDate, returnDate, roomsNumber]
  );

  return (
    <Box
      direction='row'
      align='end'
      justify='center'
      margin={{ bottom: 'small' }}
    >
      <Box
        direction='column'
        margin={{ right: 'small' }}
      >
        <Label>When</Label>
        <DateInput
          buttonProps={{
            label: `${dateFormat.format(new Date(departureDate))} - ${dateFormat.format(new Date(returnDate))}`,
            size: 'large',
            icon: undefined,
            style: {
              height: '2.5rem',
              background: 'white',
              color: 'black',
              border: '1px solid black',
              borderRadius: '2.5rem',
            }
          }}
          calendarProps={{
            bounds: [defaultStartDay.toISO(), defaultEndDay.toISO()],
            fill: false,
            alignSelf: 'center',
            margin: 'small',
            size: 'medium'
          }}
          value={[departureDate, returnDate]}
          onChange={({ value }) => handleDateChange({ value } as { value: string[] })}
        />
      </Box>
      <Box
        width='80px'
        direction='column'
        margin={{ right: 'small' }}
      >
        <Label>Rooms</Label>
        <Box>
          <RoomsNumber
            size='medium'
            focusIndicator={false}
            suggestions={['1', '2', '3', '4', '5', '6', '7']}
            placeholder='Rooms number'
            value={roomsNumber}
            type='number'
            min={1}
            onSelect={({ suggestion }) => setroomsNumber(Number(suggestion))}
            onChange={(event) => {
              const value = Number(event.target.value);
              setroomsNumber(value !== 0 ? value : 1);
            }}
          />
        </Box>
      </Box>
      <WhiteButton
        // style={{
        //   border: '1px solid rgba(227, 231, 236, 0.3)',
        //   fontFamily: 'Inter',
        //   fontStyle: 'normal',
        //   fontWeight: 400,
        //   color: '#fff',
        //   fontSize: '1.25rem',
        //   lineHeight: '1.5rem',
        //   borderRadius: '.5rem',
        //   alignSelf: 'end',
        // }}
        disabled={getDate === undefined}
        size='large'
        label='Search'
        onClick={() => handleSearch()}
      />
    </Box>
  );
};

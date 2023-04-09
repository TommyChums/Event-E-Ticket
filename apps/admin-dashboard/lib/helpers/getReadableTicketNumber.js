export default function getReadableTicketNumber(num) {
  let ticketNumber = num.toString();

  while (ticketNumber.length < 4) {
    ticketNumber = `0${ticketNumber}`;
  };

  return ticketNumber;
};

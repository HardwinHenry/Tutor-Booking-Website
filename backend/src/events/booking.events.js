const EventEmitter = require('events');

class BookingEventEmitter extends EventEmitter {}

const bookingEvents = new BookingEventEmitter();

// Event names constants
const BOOKING_EVENT_NAMES = {
  CREATED: 'booking.created',
  CONFIRMED: 'booking.confirmed',
  REJECTED: 'booking.rejected',
  CANCELLED: 'booking.cancelled',
  COMPLETED: 'booking.completed',
};

// Set max listeners to prevent warnings during high load / multiple subscribers
bookingEvents.setMaxListeners(50);

// Default logger listeners for tracking and telemetry
bookingEvents.on(BOOKING_EVENT_NAMES.CREATED, (booking) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BookingEvent] Created: ${booking._id} by learner ${booking.learnerId}`);
  }
});

bookingEvents.on(BOOKING_EVENT_NAMES.CONFIRMED, (booking) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BookingEvent] Confirmed: ${booking._id} by tutor ${booking.tutorId}`);
  }
});

bookingEvents.on(BOOKING_EVENT_NAMES.REJECTED, (booking) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BookingEvent] Rejected: ${booking._id} by tutor ${booking.tutorId}`);
  }
});

bookingEvents.on(BOOKING_EVENT_NAMES.CANCELLED, (booking) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BookingEvent] Cancelled: ${booking._id} by ${booking.cancelledByRole}`);
  }
});

bookingEvents.on(BOOKING_EVENT_NAMES.COMPLETED, (booking) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BookingEvent] Completed: ${booking._id}`);
  }
});

module.exports = {
  bookingEvents,
  BOOKING_EVENT_NAMES,
};

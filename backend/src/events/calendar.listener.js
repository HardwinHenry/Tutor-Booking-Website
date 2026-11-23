const { bookingEvents, BOOKING_EVENT_NAMES } = require('./booking.events');
const calendarService = require('../services/calendar.service');

let isInitialized = false;

/**
 * Register calendar synchronization event listeners
 */
const initCalendarEventListeners = () => {
  if (isInitialized) {
    return;
  }

  // Auto-sync to Google Calendar when a booking is confirmed
  bookingEvents.on(BOOKING_EVENT_NAMES.CONFIRMED, async (booking) => {
    try {
      await calendarService.syncBookingConfirmed(booking);
    } catch (err) {
      console.error(`[CalendarListener] Failed to handle booking.confirmed: ${err.message}`);
    }
  });

  // Auto-cancel/remove from Google Calendar when a booking is cancelled
  bookingEvents.on(BOOKING_EVENT_NAMES.CANCELLED, async (booking) => {
    try {
      await calendarService.syncBookingCancelled(booking);
    } catch (err) {
      console.error(`[CalendarListener] Failed to handle booking.cancelled: ${err.message}`);
    }
  });

  isInitialized = true;
};

module.exports = {
  initCalendarEventListeners,
};

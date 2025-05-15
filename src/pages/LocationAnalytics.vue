<template>
  <div class="location-analytics-page">
    <button @click="goBackToManageLocations" class="back-button">← Back to Manage Locations</button>
    <h1>Location Analytics for {{ locationName || 'Unknown Location' }}</h1>
    <div v-if="isLoading && !bookings.length" class="loading-message">Loading analytics...</div> <!-- Adjusted v-if for initial load -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-if="!isLoading || bookings.length > 0" class="analytics-content"> <!-- Adjusted v-if for showing content once loaded or if bookings are present -->
      <section class="calendar-section card">
        <h2>Booking Calendar</h2>
        <v-calendar
          :attributes="calendarAttributes"
          is-expanded
          @dayclick="onDayClick"
          @update:from-page="handlePageUpdate" 
        ></v-calendar>
        <p class="calendar-legend">
          <span class="legend-item"><span class="color-box available"></span> Available</span>
          <span class="legend-item"><span class="color-box occupied"></span> Occupied</span>
          <!-- Add other legend items if needed -->
        </p>
      </section>

      <section class="stats-section card">
        <h2>Key Metrics for Current Month</h2>
        <p>Total Confirmed Bookings: {{ totalConfirmedBookingsInMonth }}</p>
        <p>Total Revenue: ${{ totalRevenueInMonth.toFixed(2) }}</p>
        <p>Average Daily Rate (ADR): ${{ averageDailyRateInMonth.toFixed(2) }}</p>
        <p>Average Length of Stay: {{ averageLengthOfStayInMonth.toFixed(1) }} nights</p>
        <p>Occupancy Rate: {{ occupancyRate.toFixed(2) }}%</p>
        <p>Cancellation Rate: {{ cancellationRateInMonth.toFixed(2) }}%</p>

        
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Calendar } from 'v-calendar';
import 'v-calendar/src/styles/base.css';

// Removed Pie and Bar imports from vue-chartjs

export default {
  name: 'LocationAnalytics',
  components: {
    VCalendar: Calendar,
    // Removed PieChart and BarChart components
  },
  data() {
    return {
      locationId: null,
      locationName: '',
      bookings: [],
      calendarAttributes: [],
      isLoading: true,
      errorMessage: '',
      totalConfirmedBookingsInMonth: 0,
      occupancyRate: 0,
      totalRevenueInMonth: 0,
      averageDailyRateInMonth: 0,
      cancellationRateInMonth: 0,
      averageLengthOfStayInMonth: 0,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),

      // Removed all chart specific data properties (e.g., occupancyChartData, chartOptions)
    };
  },
  created() {
    this.locationId = this.$route.params.locationId;
    if (this.locationId) {
      console.log(`Analytics page created for location ID: ${this.locationId}`);
      this.fetchLocationDetailsAndBookings();
    } else {
      this.errorMessage = 'Location ID not provided in route parameters.';
      this.isLoading = false;
      console.error(this.errorMessage);
      // Removed call to initializeEmptyChartData()
    }
  },
  methods: {
    goBackToManageLocations() {
      this.$router.push({ name: 'ManageLocationPage' }); // Assuming 'ManageLocationPage' is the route name
    },
    handlePageUpdate(page) {
      console.log('Calendar page updated:', page);
      if (page && page.month && page.year) {
        // v-calendar months are 1-based, JavaScript months are 0-based
        this.currentMonth = page.month - 1; 
        this.currentYear = page.year;
        console.log(`Current month/year updated to: ${this.currentMonth + 1}/${this.currentYear}`);
        // Re-process data for the new month/year
        // We only need to re-process if bookings data is already loaded.
        // fetchLocationDetailsAndBookings will call processBookingsData internally.
        // If we are just navigating months, bookings are already fetched.
        if (this.bookings.length > 0 || !this.isLoading) { // Ensure bookings are loaded or not in initial load
             this.processBookingsData();
        }
      }
    },
    async fetchLocationDetailsAndBookings() {
      this.isLoading = true;
      this.errorMessage = ''; // Reset error message
      // Removed call to initializeEmptyChartData()

      try {
        // Fetch location details (name)
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = 'Authentication token not found. Please log in.';
          this.isLoading = false;
          this.$router.push('/login');
          return;
        }

        console.log(`Fetching details for location ID: ${this.locationId}`);
        const detailsResponse = await axios.get(`http://localhost:3001/locations/${this.locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.locationName = detailsResponse.data.name;
        console.log(`Location name: ${this.locationName}`);

        // Fetch location bookings
        console.log(`Fetching bookings for location ID: ${this.locationId}`);
        const bookingsResponse = await axios.get(`http://localhost:3001/bookings/location/${this.locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.bookings = bookingsResponse.data;
        console.log('Bookings fetched:', this.bookings);
        
        this.processBookingsData();

      } catch (error) {
        console.error('Error fetching location data:', error);
        this.errorMessage = `Failed to load location analytics. ${error.response ? error.response.data.error || error.message : error.message}`;
        // Removed call to initializeEmptyChartData()
      } finally {
        this.isLoading = false;
        console.log(`Finished loading. isLoading: ${this.isLoading}, errorMessage: ${this.errorMessage}`);
      }
    },
    // Removed initializeEmptyChartData() method

    processBookingsData() {
      if (!Array.isArray(this.bookings)) {
        console.error('Bookings data is not an array:', this.bookings);
        this.errorMessage = 'Received invalid booking data format.';
        this.bookings = []; // Ensure bookings is an array
        // Removed call to initializeEmptyChartData()
      }
      
      this.prepareCalendarAttributes();
      this.calculateMonthlyMetrics(); // Changed from calculateOccupancyRate
      console.log('Calendar attributes prepared, monthly metrics calculated.');
    },
    prepareCalendarAttributes() {
      const attributes = [];
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const occupiedDateStrings = new Set(); // Stores string representations ('YYYY-MM-DD') of occupied dates

      // 1. Process bookings: Add RED HIGHLIGHT attributes for occupied periods 
      //    AND populate occupiedDateStrings set with each individual occupied day.
      if (Array.isArray(this.bookings)) {
        this.bookings.forEach(booking => {
          if (booking.status_name === 'confirmed' || booking.status_name === 'active') {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);

            // Normalize to UTC for consistent date handling and string formatting
            const localBookingStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
            const localBookingEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

            attributes.push({
              key: `booking-highlight-${booking.booking_id}`,
              highlight: {
                color: 'red',
                fillMode: 'solid',
              },
              dates: { start: localBookingStart, end: localBookingEnd },
              popover: {
                label: `Occupied - Booking ID: ${booking.booking_id}${booking.user_name ? ', Guest: ' + booking.user_name : ''}`,
                visibility: 'hover',
              },
              order: 1 // Occupied highlights take precedence
            });

            // Add each day within this booking to the occupiedDateStrings set
            let currentDateIterator = new Date(localBookingStart);
            while (currentDateIterator <= localBookingEnd) {
              occupiedDateStrings.add(currentDateIterator.toISOString().split('T')[0]);
              currentDateIterator.setUTCDate(currentDateIterator.getUTCDate() + 1);
            }
          }
        });
      }

      // 2. Determine truly available dates (those NOT in occupiedDateStrings) 
      //    and prepare them for the BLUE DOT indicator.
      const availableDatesForDots = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const dayInMonth = new Date(Date.UTC(year, month, i)); // Create as UTC for consistent comparison
        const dayString = dayInMonth.toISOString().split('T')[0];
        
        if (!occupiedDateStrings.has(dayString)) {
          availableDatesForDots.push(dayInMonth); // Add the Date object if not occupied
        }
      }

      // Add BLUE DOTS for truly available dates
      if (availableDatesForDots.length > 0) {
        attributes.push({
          key: 'available-days-dots',
          dot: {
            color: 'blue',
          },
          dates: availableDatesForDots,
          popover: {
            label: 'Available',
            visibility: 'hover',
          },
          order: 0 // Dots are a base layer
        });
      }
      
      this.calendarAttributes = attributes;
    },
    // Renamed from calculateOccupancyRate and enhanced
    calculateMonthlyMetrics() {
      const year = this.currentYear;
      const month = this.currentMonth; // 0-indexed
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

      let occupiedDaysInMonth = 0;
      let currentMonthConfirmedBookingsCount = 0;
      let totalRevenueForMonth = 0;
      let totalNightsForAllBookingsInMonth = 0;
      let bookingsTouchingMonthCountForAvgStay = 0; // For avg. length of stay denominator
      
      let cancelledBookingsInMonthCount = 0;
      let allBookingsTouchingMonthCountForCancellation = 0; // For cancellation rate denominator

      // Removed sanitizeRateForChart helper function

      if (!Array.isArray(this.bookings) || this.bookings.length === 0) {
        this.totalConfirmedBookingsInMonth = 0;
        this.occupancyRate = 0;
        this.totalRevenueInMonth = 0;
        this.averageDailyRateInMonth = 0;
        this.cancellationRateInMonth = 0;
        this.averageLengthOfStayInMonth = 0;
        // Removed call to initializeEmptyChartData()
        console.log('No bookings data to process for metrics.');
        return;
      }

      this.bookings.forEach(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        const localBookingStart = new Date(Date.UTC(bookingStart.getUTCFullYear(), bookingStart.getUTCMonth(), bookingStart.getUTCDate()));
        const localBookingEnd = new Date(Date.UTC(bookingEnd.getUTCFullYear(), bookingEnd.getUTCMonth(), bookingEnd.getUTCDate()));

        const firstDayOfMonthUTC = new Date(Date.UTC(year, month, 1));
        const lastDayOfMonthUTC = new Date(Date.UTC(year, month, daysInCurrentMonth, 23, 59, 59, 999));

        // Check if the booking overlaps with the current month
        const bookingTouchesCurrentMonth = localBookingStart <= lastDayOfMonthUTC && localBookingEnd >= firstDayOfMonthUTC;

        if (bookingTouchesCurrentMonth) {
          allBookingsTouchingMonthCountForCancellation++;

          if (booking.status_name === 'cancelled') {
            cancelledBookingsInMonthCount++;
          }

          if (booking.status_name === 'confirmed' || booking.status_name === 'active') {
            currentMonthConfirmedBookingsCount++;
            bookingsTouchingMonthCountForAvgStay++;

            // Calculate duration of the booking within the current month
            const effectiveStartDateInMonth = localBookingStart < firstDayOfMonthUTC ? firstDayOfMonthUTC : localBookingStart;
            const effectiveEndDateInMonth = localBookingEnd > lastDayOfMonthUTC ? lastDayOfMonthUTC : localBookingEnd;
            
            // Calculate days this booking is active within the current month (+1 because it's inclusive of start and end day)
            const daysInMonthForThisBooking = Math.max(0, (effectiveEndDateInMonth.getTime() - effectiveStartDateInMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            occupiedDaysInMonth += daysInMonthForThisBooking;

            // Revenue calculation: Use total_price from the booking directly if status is confirmed/active
            // This assumes total_price is for the entire booking duration.
            // If a booking spans multiple months, this will credit the full booking price to each month it touches.
            // For a more accurate monthly revenue, you'd prorate the total_price based on days in *this* month.
            // However, the prompt asks to sum the amount of each booking for revenue.
            if (typeof booking.total_price === 'number' && booking.total_price > 0) {
              totalRevenueForMonth += booking.total_price;
            } else {
              console.warn(`Booking ID ${booking.booking_id} (status: ${booking.status_name}) has ${daysInMonthForThisBooking} day(s) in the current month but no valid total_price (${booking.total_price}). Revenue contribution for this booking in this month will be 0.`, booking);
            }

            // Average Length of Stay: sum of total nights of bookings active in the month
            // Total nights for this specific booking (end date - start date)
            const totalNightsThisBooking = Math.max(1, Math.ceil((localBookingEnd.getTime() - localBookingStart.getTime()) / (1000 * 60 * 60 * 24)));
            totalNightsForAllBookingsInMonth += totalNightsThisBooking;
          }
        }
      });
      
      this.totalConfirmedBookingsInMonth = currentMonthConfirmedBookingsCount;
      
      // Clamp occupiedDaysInMonth to not exceed daysInCurrentMonth (e.g. for a single unit location)
      occupiedDaysInMonth = Math.min(occupiedDaysInMonth, daysInCurrentMonth);

      // Occupancy Rate
      if (daysInCurrentMonth > 0) {
        const rawOccupancyRate = (occupiedDaysInMonth / daysInCurrentMonth) * 100;
        this.occupancyRate = parseFloat(rawOccupancyRate.toFixed(2));
        // Removed occupancyChartData assignment
      } else {
        this.occupancyRate = 0;
        // Removed occupancyChartData assignment
      }

      this.totalRevenueInMonth = parseFloat(totalRevenueForMonth.toFixed(2));

      this.averageDailyRateInMonth = occupiedDaysInMonth > 0 ? parseFloat((totalRevenueForMonth / occupiedDaysInMonth).toFixed(2)) : 0;
      
      this.averageLengthOfStayInMonth = bookingsTouchingMonthCountForAvgStay > 0 ? parseFloat((totalNightsForAllBookingsInMonth / bookingsTouchingMonthCountForAvgStay).toFixed(1)) : 0;

      // Cancellation Rate
      if (allBookingsTouchingMonthCountForCancellation > 0) {
        const rawCancellationRate = (cancelledBookingsInMonthCount / allBookingsTouchingMonthCountForCancellation) * 100;
        this.cancellationRateInMonth = parseFloat(rawCancellationRate.toFixed(2));
        // Removed cancellationChartData assignment
      } else {
        this.cancellationRateInMonth = 0;
        // Removed cancellationChartData assignment
      }

      // Removed assignments for bookingsChartData, revenueChartData, adrChartData, avgStayChartData

      console.log(`Monthly Metrics for ${month + 1}/${year}:`);
      console.log(`  Total Confirmed Bookings: ${this.totalConfirmedBookingsInMonth}`);
      console.log(`  Occupancy Rate: ${this.occupancyRate}% (Occupied Days: ${occupiedDaysInMonth}, Days in Month: ${daysInCurrentMonth})`);
      console.log(`  Total Revenue: ${this.totalRevenueInMonth}`);
      console.log(`  Average Daily Rate (ADR): ${this.averageDailyRateInMonth}`);
      console.log(`  Average Length of Stay: ${this.averageLengthOfStayInMonth} nights`);
      console.log(`  Cancellation Rate: ${this.cancellationRateInMonth}% (Cancelled: ${cancelledBookingsInMonthCount}, Total Considered: ${allBookingsTouchingMonthCountForCancellation})`);
    },
    onDayClick(day) {
      console.log('Day clicked:', day.date, 'Attributes on this day:', day.attributes);
      // You could implement logic here to show details of bookings for the clicked day
    }
  }
};
</script>

<style scoped>
.location-analytics-page {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.back-button {
  background-color: #f8f9fa; /* Light grey background */
  border: 1px solid #dee2e6; /* Grey border */
  color: #212529; /* Dark text color */
  padding: 8px 15px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9em;
  font-weight: bold;
  margin-bottom: 20px; /* Space below the button */
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

.back-button:hover {
  background-color: #e9ecef; /* Slightly darker on hover */
  color: #000;
}

.loading-message, .error-message {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  border-radius: 4px;
  margin-bottom: 20px;
}

.loading-message {
  color: #333;
  background-color: #f0f0f0;
}

.error-message {
  color: #D8000C; /* Error red */
  background-color: #FFD2D2; /* Light red background */
  border: 1px solid #D8000C;
}

.card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.analytics-content h1, .analytics-content h2 {
  color: #333;
}

.analytics-content h1 {
  text-align: center;
  margin-bottom: 30px;
}

.analytics-content h2 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

/* Ensure v-calendar expands and is visible */
.calendar-section .v-calendar {
  border: 1px solid #ddd; /* Add a light border to ensure it's not invisible */
  min-height: 300px; /* Ensure it has some height */
}

.calendar-legend {
  margin-top: 15px;
  font-size: 0.9em;
  text-align: center;
}

.legend-item {
  margin-right: 15px;
  display: inline-flex;
  align-items: center;
}

.color-box {
  width: 15px;
  height: 15px;
  margin-right: 5px;
  border: 1px solid #ccc;
  display: inline-block;
}

.color-box.available {
  background-color: lightblue; /* Legend color remains lightblue for simplicity */
}

.color-box.occupied {
  background-color: red; /* Corresponds to booking highlight */
}

.stats-section p {
  font-size: 1.1em;
  line-height: 1.6;
  color: #555;
  margin-bottom: 10px; /* Add some space between metric paragraphs */
}

/* Removed .charts-grid and .chart-container styles */
</style>

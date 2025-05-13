<template>
  <div class="location-analytics-page">
    <button @click="goBackToManageLocations" class="back-button">← Back to Manage Locations</button>
    <h1>Location Analytics for {{ locationName || 'Unknown Location' }}</h1>
    <div v-if="isLoading" class="loading-message">Loading analytics...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-if="!isLoading && !errorMessage" class="analytics-content">
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
        <p>Total Confirmed Bookings (in current month): {{ totalConfirmedBookingsInMonth }}</p>
        <p>Occupancy Rate (current month): {{ occupancyRate }}%</p>
        <!-- Add more detailed stats as needed -->
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
// For v-calendar 2.x, ensure you installed with npm install v-calendar@^2.4.1 or similar
import { Calendar } from 'v-calendar'; 
import 'v-calendar/src/styles/base.css'; // Corrected CSS import path for v-calendar v2.x

export default {
  name: 'LocationAnalytics',
  components: {
    VCalendar: Calendar,
  },
  data() {
    return {
      locationId: null,
      locationName: '',
      bookings: [],
      calendarAttributes: [],
      isLoading: true,
      errorMessage: '',
      totalConfirmedBookingsInMonth: 0, // Renamed for clarity
      occupancyRate: 0,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
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
      } finally {
        this.isLoading = false;
        console.log(`Finished loading. isLoading: ${this.isLoading}, errorMessage: ${this.errorMessage}`);
      }
    },
    processBookingsData() {
      if (!Array.isArray(this.bookings)) {
        console.error('Bookings data is not an array:', this.bookings);
        this.errorMessage = 'Received invalid booking data format.';
        this.bookings = []; // Ensure bookings is an array
      }
      
      // totalConfirmedBookingsInMonth will be calculated in calculateOccupancyRate
      this.prepareCalendarAttributes();
      this.calculateOccupancyRate(); // This will also set totalConfirmedBookingsInMonth
      console.log('Calendar attributes prepared:', this.calendarAttributes);
    },
    prepareCalendarAttributes() {
      const attributes = [];
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const occupiedDateStrings = new Set(); // Stores string representations ('YYYY-MM-DD') of occupied dates

      // 1. Process bookings: Add RED HIGHLIGHT attributes for occupied periods 
      //    AND populate occupiedDateStrings set with each individual occupied day.
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
    calculateOccupancyRate() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
      
      let occupiedDaysInMonth = 0;
      let currentMonthBookingsCount = 0;

      this.bookings.forEach(booking => {
        if (booking.status_name === 'confirmed' || booking.status_name === 'active') {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);

          // Normalize to UTC dates to avoid timezone shifts when comparing month/year
          const localBookingStart = new Date(Date.UTC(bookingStart.getUTCFullYear(), bookingStart.getUTCMonth(), bookingStart.getUTCDate()));
          const localBookingEnd = new Date(Date.UTC(bookingEnd.getUTCFullYear(), bookingEnd.getUTCMonth(), bookingEnd.getUTCDate()));
          
          // Check if the booking is in the current month and year
          if (localBookingStart.getUTCFullYear() === year && localBookingStart.getUTCMonth() === month) {
            currentMonthBookingsCount++;
          } else if (localBookingEnd.getUTCFullYear() === year && localBookingEnd.getUTCMonth() === month) {
            // Catches bookings that end in the current month but started earlier
             currentMonthBookingsCount++; // Count it if any part is in the month
          } else if (localBookingStart.getUTCFullYear() < year || (localBookingStart.getUTCFullYear() === year && localBookingStart.getUTCMonth() < month)) {
            if (localBookingEnd.getUTCFullYear() > year || (localBookingEnd.getUTCFullYear() === year && localBookingEnd.getUTCMonth() > month)) {
              // Booking spans across the entire current month
              currentMonthBookingsCount++;
            }
          }


          // Calculate duration within the current month
          const startDayOfMonth = new Date(Date.UTC(year, month, 1));
          const endDayOfMonth = new Date(Date.UTC(year, month, daysInCurrentMonth, 23, 59, 59, 999));

          const effectiveStartDate = localBookingStart < startDayOfMonth ? startDayOfMonth : localBookingStart;
          const effectiveEndDate = localBookingEnd > endDayOfMonth ? endDayOfMonth : localBookingEnd;
          
          if (effectiveStartDate <= effectiveEndDate) { // Ensure the period is valid and within the month
            // Calculate days, add 1 because it's inclusive
            const durationInMonth = Math.ceil((effectiveEndDate - effectiveStartDate) / (1000 * 60 * 60 * 24)) + 1;
            // Ensure we only count days actually within the month's bounds
             if (localBookingStart <= endDayOfMonth && localBookingEnd >= startDayOfMonth) {
                occupiedDaysInMonth += durationInMonth;
             }
          }
        }
      });
      
      this.totalConfirmedBookingsInMonth = currentMonthBookingsCount;

      // Clamp occupiedDaysInMonth to not exceed daysInCurrentMonth
      occupiedDaysInMonth = Math.min(occupiedDaysInMonth, daysInCurrentMonth);

      this.occupancyRate = daysInCurrentMonth > 0 ? parseFloat(((occupiedDaysInMonth / daysInCurrentMonth) * 100).toFixed(2)) : 0;
      console.log(`Occupancy Rate: ${this.occupancyRate}%, Occupied Days: ${occupiedDaysInMonth}, Days in Month: ${daysInCurrentMonth}, Bookings in Month: ${this.totalConfirmedBookingsInMonth}`);
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
  background-color: red;
}

.stats-section p {
  font-size: 1.1em;
  margin-bottom: 10px;
  color: #555;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .location-analytics-page {
    padding: 15px;
  }
  .analytics-content h1 {
    font-size: 1.8em;
  }
  .analytics-content h2 {
    font-size: 1.3em;
  }
}
</style>

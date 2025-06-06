<template>
  <div class="location-analytics-page">
    <button @click="goBackToManageLocations" class="back-button">← Back to Manage Locations</button>
    <h1>Location Analytics for {{ locationName || 'Unknown Location' }}</h1>
    <div v-if="isLoading && !bookings.length && !ownerUnavailabilities.length" class="loading-message">Loading analytics...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-if="!isLoading || bookings.length > 0 || ownerUnavailabilities.length > 0" class="analytics-content">
      <section class="calendar-section card">
        <h2>Booking & Unavailability Calendar</h2>

        <!-- Form for Adding New Unavailability -->
        <div class="unavailability-form" v-if="locationId">
          <h3>Mark Dates as Unavailable</h3>
          <v-date-picker 
            v-model="newUnavailabilityRange" 
            is-range 
            :min-date="new Date()"
            :masks="{ input: 'YYYY-MM-DD' }"
            :attributes="calendarAttributesForSelection" 
            :disabled-dates="allDisabledDatesForOwnerCalendar"
          >
            <template v-slot="{ inputValue, inputEvents }">
              <div class="date-input-group">
                <input
                  class="date-input"
                  placeholder="Start Date"
                  :value="inputValue.start"
                  v-on="inputEvents.start"
                />
                <span class="date-separator">→</span>
                <input
                  class="date-input"
                  placeholder="End Date"
                  :value="inputValue.end"
                  v-on="inputEvents.end"
                />
              </div>
            </template>
          </v-date-picker>
          
          <!-- Conditionally show reason input and button -->
          <div v-if="newUnavailabilityRange.start && newUnavailabilityRange.end" class="unavailability-actions">
            <input 
              type="text" 
              v-model="newUnavailabilityReason" 
              placeholder="Reason (optional)" 
              class="reason-input"
            />
            <button @click="addUnavailability" :disabled="isSubmittingUnavailability" class="action-btn">
              {{ isSubmittingUnavailability ? 'Saving...' : 'Mark Unavailable' }}
            </button>
          </div>
        </div>

        <!-- Calendar for Displaying Bookings and Unavailabilities -->
        <v-calendar
          ref="analyticsCalendar" 
          :attributes="calendarAttributes"
          is-expanded
          @dayclick="onDayClick"
          @update:from-page="handlePageUpdate" 
        ></v-calendar>
        
        <p class="calendar-legend">
          <span class="legend-item"><span class="color-box available"></span> Available</span>
          <span class="legend-item"><span class="color-box occupied"></span> Occupied by Booking</span>
          <span class="legend-item"><span class="color-box owner-unavailable"></span> Owner Unavailable</span>
        </p>

        <div class="existing-unavailabilities" v-if="ownerUnavailabilities.length > 0">
          <h3>Existing Unavailability Periods</h3>
          <ul>
            <li v-for="period in ownerUnavailabilities" :key="period.unavailability_id">
              {{ formatDate(period.start_date) }} - {{ formatDate(period.end_date) }}
              <span v-if="period.reason"> ({{ period.reason }})</span>
              <button @click="deleteUnavailability(period.unavailability_id)" class="delete-btn btn-small" :disabled="isDeletingUnavailability === period.unavailability_id">
                {{ isDeletingUnavailability === period.unavailability_id ? 'Deleting...' : 'Delete' }}
              </button>
            </li>
          </ul>
        </div>
      </section>

      <section class="stats-section card">
        <div class="metrics-header">
          <h2>Key Metrics for {{ metricsDisplayMonthName }} {{ metricsDisplayYear }}</h2>
          <button @click="resetToActualCurrentMonth" v-if="!isActualCurrentMonthDisplayed" class="btn-small btn-secondary">View Actual Current Month</button>
        </div>
        <div class="key-metrics-grid">
          <div class="metric-item metric-text-display">
            <h3>Total Confirmed Bookings</h3>
            <p class="metric-value"><strong>{{ totalConfirmedBookingsInMonth }}</strong></p>
          </div>
          <div class="metric-item metric-text-display">
            <h3>Average Length of Stay</h3>
            <p class="metric-value"><strong>{{ Math.round(averageLengthOfStayInMonth) }} nights</strong></p>
          </div>

          <div class="metric-item metric-text-display">
            <h3>Total Revenue</h3>
            <p class="metric-value"><strong>${{ totalRevenueInMonth.toFixed(2) }}</strong></p>
          </div>
          <div class="metric-item metric-text-display">
            <h3>Average Daily Rate (ADR)</h3>
            <p class="metric-value"><strong>${{ averageDailyRateInMonth.toFixed(2) }}</strong></p>
          </div>
          
          <div class="metric-item chart-container-metric">
            <h3>Occupancy Rate</h3>
            <pie-chart :data="occupancyRatePieChartData" :library="pieChartOptions" height="120px"></pie-chart>
            <p class="metric-value-pie"><strong>{{ occupancyRate.toFixed(2) }}%</strong></p>
          </div>
          <div class="metric-item chart-container-metric">
            <h3>Cancellation Rate</h3>
            <pie-chart :data="cancellationRatePieChartData" :library="pieChartOptions" height="120px"></pie-chart>
            <p class="metric-value-pie"><strong>{{ cancellationRateInMonth.toFixed(2) }}%</strong></p>
          </div>
        </div>

        <!-- Main Chart Section -->
        <div class="chart-container main-chart-container" v-if="bookingsPerMonthChartData && bookingsPerMonthChartData.length > 0">
          <h3>Bookings Over Past 12 Months</h3>
          <column-chart :data="bookingsPerMonthChartData" :download="true" :library="chartOptionsWithClickHandler"></column-chart>
        </div>
        <div v-else-if="!isLoading && (!bookingsPerMonthChartData || bookingsPerMonthChartData.length === 0)" class="no-chart-data">
          <p>No booking data available for the past 12 months to display the chart.</p>
        </div>
        
        <!-- Section to display bookings for the selected month -->
        <div v-if="selectedMonthKey && bookingsInSelectedMonth.length > 0" class="selected-month-bookings card">
          <h3>Bookings for {{ selectedMonthKey }}</h3>
          <button @click="clearSelectedMonthBookings" class="btn-small clear-selection-btn">Clear Selection</button>
          <ul>
            <li v-for="booking in bookingsInSelectedMonth" :key="booking.booking_id">
              <strong>Guest:</strong> {{ booking.user_name || 'N/A' }}<br>
              <strong>Dates:</strong> {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}<br>
              <strong>Status:</strong> {{ booking.status_name }}<br>
              <strong>Total Price:</strong> ${{ booking.total_price ? parseFloat(booking.total_price).toFixed(2) : '0.00' }}
            </li>
          </ul>
        </div>
        <div v-if="selectedMonthKey && bookingsInSelectedMonth.length === 0" class="no-bookings-selected-month card">
            <p>No bookings found for {{ selectedMonthKey }}.</p>
            <button @click="clearSelectedMonthBookings" class="btn-small clear-selection-btn">Clear Selection</button>
        </div>
        
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/src/styles/base.css';

export default {
  name: 'LocationAnalytics',
  components: {
    VCalendar: Calendar,
    VDatePicker: DatePicker,
  },
  data() {
    return {
      locationId: null,
      locationName: '',
      bookings: [],
      ownerUnavailabilities: [], 
      calendarAttributes: [],
      isLoading: true,
      errorMessage: '',
      newUnavailabilityRange: { start: null, end: null }, 
      newUnavailabilityReason: '', 
      isSubmittingUnavailability: false, 
      isDeletingUnavailability: null, 
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      debouncedProcessData: null, // Added for debouncing
      selectedMonthKey: null, // For storing the key of the clicked month (e.g., "May 2025")
      bookingsInSelectedMonth: [], // To store bookings for the selected month
      chartOptions: { // Defined for Chart.js v3
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { // Chart.js v3 syntax
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Bookings'
            }
          },
          x: { // Chart.js v3 syntax
            title: {
              display: true,
              text: 'Month'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      },
    };
  },
  computed: { 
    chartOptionsWithClickHandler() {
      return {
        ...this.chartOptions,
        onClick: (event, elements) => {
          console.log('Chart clicked. Event:', event, 'Elements:', elements);
          if (elements.length > 0) {
            const chartElement = elements[0];
            const dataIndex = chartElement.index;
            console.log('Chart element index:', dataIndex);
            
            if (this.bookingsPerMonthChartData && dataIndex < this.bookingsPerMonthChartData.length) {
              const monthYearLabel = this.bookingsPerMonthChartData[dataIndex][0]; 
              console.log('MonthYearLabel from chart data:', monthYearLabel);
              this.handleChartMonthClick(monthYearLabel);
            } else {
              console.error('Could not get monthYearLabel: bookingsPerMonthChartData might be undefined or index out of bounds.');
            }
          } else {
            console.log('No chart elements clicked.');
          }
        }
      };
    },
    metricsDisplayMonthName() {
      return new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' });
    },
    metricsDisplayYear() {
      return this.currentYear;
    },
    isActualCurrentMonthDisplayed() {
      const today = new Date();
      return this.currentYear === today.getFullYear() && this.currentMonth === today.getMonth();
    },
    totalRevenueChartData() {
      return [['Revenue', parseFloat(this.totalRevenueInMonth.toFixed(2))]];
    },
    averageDailyRateChartData() {
      return [['ADR', parseFloat(this.averageDailyRateInMonth.toFixed(2))]];
    },
    metricChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            title: { // Explicitly define the title structure
              display: true, 
              text: '' // This will be overridden by the ytitle prop in <column-chart>
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (context.parsed.y !== null) {
                        // For [['MetricName', value]], ChartKick makes 'MetricName' the label of the dataset.
                        // context.chart.data.labels[0] would be 'MetricName'
                        label = (context.chart.data.labels && context.chart.data.labels[0] ? context.chart.data.labels[0] : (context.dataset.label || 'Value')) + ': ' + context.parsed.y;
                    }
                    return label;
                },
                title: function() {
                    return '';
                }
            }
          }
        },
        animation: false
      };
    },
    metricChartOptionsPercent() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (context.parsed.y !== null) {
                         label = context.chart.data.labels[0] + ': ' + context.parsed.y.toFixed(2) + '%';
                    }
                    return label;
                },
                title: function() {
                    return '';
                }
            }
          }
        },
        animation: false
      };
    },
    allDisabledDatesForOwnerCalendar() {
      return this.bookings
        .filter(b => b.status_name === 'confirmed' || b.status_name === 'active')
        .map(b => ({ start: new Date(b.start_date), end: new Date(b.end_date) }));
    },
    calendarAttributesForSelection() {
      const attributes = [];
      if (Array.isArray(this.bookings)) {
        this.bookings.forEach(booking => {
          if (booking.status_name === 'confirmed' || booking.status_name === 'active') {
            attributes.push({
              key: `booked-for-select-${booking.booking_id}`,
              highlight: { color: 'red', fillMode: 'light' },
              dates: { start: new Date(booking.start_date), end: new Date(booking.end_date) },
              popover: { label: 'Booked', visibility: 'hover' },
            });
          }
        });
      }
      return attributes;
    },
    bookingsPerMonthChartData() {
      if (!Array.isArray(this.bookings) || this.bookings.length === 0) {
        return [];
      }

      const monthCounts = {};
      const today = new Date();

      // Initialize counts for the last 12 months (current month + 11 previous)
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        monthCounts[monthKey] = 0;
      }
      
      this.bookings.forEach(booking => {
        const bookingStartDate = new Date(booking.start_date);
        const monthKey = bookingStartDate.toISOString().substring(0, 7); // YYYY-MM

        // eslint-disable-next-line no-prototype-builtins
        if (monthCounts.hasOwnProperty(monthKey)) {
          monthCounts[monthKey]++;
        }
        // Bookings outside this specific 12-month window are ignored for this chart
      });

      // Convert to array format for chartkick, sorted from oldest to newest
      const chartData = Object.keys(monthCounts)
        .sort() // Sorts YYYY-MM strings chronologically
        .map(monthKey => {
          const [year, monthNum] = monthKey.split('-');
          const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
          const monthName = monthDate.toLocaleString('default', { month: 'short' });
          return [`${monthName} ${year}`, monthCounts[monthKey]];
        });
      
      return chartData; // e.g., [['Jun 2024', 0], ['Jul 2024', 5], ..., ['May 2025', 7]]
    },
    occupancyRatePieChartData() {
      console.log('[Debug] Calculating occupancyRatePieChartData. Occupancy Rate:', this.occupancyRate);
      const occupied = parseFloat(this.occupancyRate.toFixed(2));
      const available = parseFloat((100 - occupied).toFixed(2));
      if (isNaN(occupied) || isNaN(available)) return [['No Data', 100]];
      return [['Occupied', occupied], ['Available', Math.max(0, available)]];
    },
    cancellationRatePieChartData() {
      console.log('[Debug] Calculating cancellationRatePieChartData. Cancellation Rate:', this.cancellationRateInMonth);
      const cancelled = parseFloat(this.cancellationRateInMonth.toFixed(2));
      const notCancelled = parseFloat((100 - cancelled).toFixed(2));
       if (isNaN(cancelled) || isNaN(notCancelled)) return [['No Data', 100]];
      return [['Cancelled', cancelled], ['Not Cancelled', Math.max(0, notCancelled)]];
    },
    totalConfirmedBookingsInMonth() {
      console.log('[Debug] totalConfirmedBookingsInMonth: bookings.length', this.bookings?.length, 'currentMonth', this.currentMonth, 'currentYear', this.currentYear);
      if (!this.bookings || this.bookings.length === 0) return 0;
      return this.bookings.filter(b => {
        const bookingMonth = new Date(b.start_date).getMonth();
        const bookingYear = new Date(b.start_date).getFullYear();
        return (b.status_name === 'confirmed' || b.status_name === 'active') &&
               bookingMonth === this.currentMonth &&
               bookingYear === this.currentYear;
      }).length;
    },
    totalRevenueInMonth() {
      console.log('[Debug] totalRevenueInMonth: bookings.length', this.bookings?.length, 'currentMonth', this.currentMonth, 'currentYear', this.currentYear);
      if (!this.bookings || this.bookings.length === 0) return 0;
      return this.bookings.reduce((acc, b) => {
        const bookingMonth = new Date(b.start_date).getMonth();
        const bookingYear = new Date(b.start_date).getFullYear();
        if ((b.status_name === 'confirmed' || b.status_name === 'active') &&
            bookingMonth === this.currentMonth &&
            bookingYear === this.currentYear) {
          return acc + parseFloat(b.total_price);
        }
        return acc;
      }, 0);
    },
    averageDailyRateInMonth() {
      console.log('[Debug] averageDailyRateInMonth: bookings.length', this.bookings?.length, 'currentMonth', this.currentMonth, 'currentYear', this.currentYear);
      if (!this.bookings || this.bookings.length === 0 || this.totalConfirmedBookingsInMonth === 0) return 0;
      let totalNights = 0;
      const revenue = this.bookings.reduce((acc, b) => {
        const bookingMonth = new Date(b.start_date).getMonth();
        const bookingYear = new Date(b.start_date).getFullYear();
        if ((b.status_name === 'confirmed' || b.status_name === 'active') &&
            bookingMonth === this.currentMonth &&
            bookingYear === this.currentYear) {
          const start = new Date(b.start_date);
          const end = new Date(b.end_date);
          const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          totalNights += nights;
          return acc + parseFloat(b.total_price);
        }
        return acc;
      }, 0);
      return totalNights > 0 ? revenue / totalNights : 0;
    },
    averageLengthOfStayInMonth() {
      console.log('[Debug] averageLengthOfStayInMonth: bookings.length', this.bookings?.length, 'currentMonth', this.currentMonth, 'currentYear', this.currentYear);
      if (!this.bookings || this.bookings.length === 0 || this.totalConfirmedBookingsInMonth === 0) return 0;
      let totalNights = 0;
      let bookingCount = 0;
      this.bookings.forEach(b => {
        const bookingMonth = new Date(b.start_date).getMonth();
        const bookingYear = new Date(b.start_date).getFullYear();
        if ((b.status_name === 'confirmed' || b.status_name === 'active') &&
            bookingMonth === this.currentMonth &&
            bookingYear === this.currentYear) {
          const start = new Date(b.start_date);
          const end = new Date(b.end_date);
          totalNights += Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          bookingCount++;
        }
      });
      return bookingCount > 0 ? totalNights / bookingCount : 0;
    },
    occupancyRate() {
      console.log('[Debug] occupancyRate: bookings.length', this.bookings?.length, 'currentMonth', this.currentMonth, 'currentYear', this.currentYear);
      if (!this.bookings || this.bookings.length === 0) return 0;
      const daysInCurrentMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      let occupiedDays = 0;
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const currentDate = new Date(this.currentYear, this.currentMonth, day);
        if (this.bookings.some(b => {
          const startDate = new Date(b.start_date);
          const endDate = new Date(b.end_date);
          return (b.status_name === 'confirmed' || b.status_name === 'active') &&
                 currentDate >= startDate && currentDate < endDate; // Count nights, so up to but not including end date
        })) {
          occupiedDays++;
        }
      }
      return (occupiedDays / daysInCurrentMonth) * 100;
    },
    cancellationRateInMonth() {
      if (!this.bookings || this.bookings.length === 0) return 0;
      let cancelledBookingsInMonthCount = 0;
      let allBookingsTouchingMonthCountForCancellation = 0;

      this.bookings.forEach(b => {
        const bookingStartDate = new Date(b.start_date);
        const bookingEndDate = new Date(b.end_date);
        const localBookingStartDate = new Date(bookingStartDate.getFullYear(), bookingStartDate.getMonth(), bookingStartDate.getDate());
        const localBookingEndDate = new Date(bookingEndDate.getFullYear(), bookingEndDate.getMonth(), bookingEndDate.getDate());

        const firstDayOfDisplayMonth = new Date(this.currentYear, this.currentMonth, 1);
        const lastDayOfDisplayMonth = new Date(this.currentYear, this.currentMonth + 1, 0);

        if (localBookingStartDate <= lastDayOfDisplayMonth && localBookingEndDate >= firstDayOfDisplayMonth) {
          allBookingsTouchingMonthCountForCancellation++;
          if (b.status_name === 'cancelled') {
             const cancellationDate = b.cancellation_date ? new Date(b.cancellation_date) : null;
             const localCancellationDate = cancellationDate ? new Date(cancellationDate.getFullYear(), cancellationDate.getMonth(), cancellationDate.getDate()) : null;

             if (localCancellationDate && 
                 localCancellationDate.getMonth() === this.currentMonth &&
                 localCancellationDate.getFullYear() === this.currentYear) {
                cancelledBookingsInMonthCount++;
             } else if (!localCancellationDate && 
                        (localBookingStartDate.getMonth() === this.currentMonth && 
                         localBookingStartDate.getFullYear() === this.currentYear)) {
                // Fallback if cancellation_date is null but status is 'cancelled' and booking was for this month
                cancelledBookingsInMonthCount++;
             }
          }
        }
      });
      return allBookingsTouchingMonthCountForCancellation > 0 ? (cancelledBookingsInMonthCount / allBookingsTouchingMonthCountForCancellation) * 100 : 0;
    }
  },
  created() {
    this.locationId = this.$route.params.locationId;
    // Initialize debounced function
    this.debouncedProcessData = this.debounce(this.processBookingsAndUnavailabilityData, 500); 

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
    debounce(func, delay) { // Debounce utility function
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
      };
    },
    goBackToManageLocations() {
      this.$router.push({ name: 'ManageLocationPage' });
    },
    handlePageUpdate(page) {
      if (page && page.month && page.year) {
        this.currentMonth = page.month - 1; 
        this.currentYear = page.year;
        if (this.bookings.length > 0 || this.ownerUnavailabilities.length > 0 || !this.isLoading) { 
             // this.processBookingsAndUnavailabilityData(); // Original call
             this.debouncedProcessData(); // Call debounced version
        }
      }
    },
    async fetchLocationDetailsAndBookings() {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = 'Authentication token not found. Please log in.';
          this.isLoading = false;
          this.$router.push('/login');
          return;
        }
        const detailsResponse = await axios.get(`http://localhost:3001/locations/${this.locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.locationName = detailsResponse.data.name;
        const bookingsResponse = await axios.get(`http://localhost:3001/bookings/location/${this.locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.bookings = bookingsResponse.data;
        await this.fetchOwnerUnavailabilities();
        this.processBookingsAndUnavailabilityData();
      } catch (error) {
        console.error('Error fetching location data:', error);
        this.errorMessage = `Failed to load location analytics. ${error.response ? error.response.data.error || error.message : error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchOwnerUnavailabilities() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/locations/${this.locationId}/unavailability`, {
          headers: { Authorization: `Bearer ${token}` } 
        });
        this.ownerUnavailabilities = response.data.map(item => ({
          ...item,
          start_date: new Date(item.start_date),
          end_date: new Date(item.end_date),
        }));
      } catch (error) {
        console.error('Error fetching owner unavailabilities:', error); // Added console.error for better debugging
        // Do not set global error message here
      }
    },
    processBookingsAndUnavailabilityData() { 
      if (!Array.isArray(this.bookings)) {
        console.error('Bookings data is not an array:', this.bookings);
        this.errorMessage = 'Received invalid booking data format.';
        this.bookings = [];
      }
      // Add log for bookings here
      console.log('[Debug] processBookingsAndUnavailabilityData - Bookings received:', JSON.parse(JSON.stringify(this.bookings)));
      if (!Array.isArray(this.ownerUnavailabilities)) {
        console.error('Owner unavailabilities data is not an array:', this.ownerUnavailabilities);
        this.ownerUnavailabilities = [];
      }
      this.prepareCalendarAttributes();
      this.calculateMonthlyMetrics(); // This will trigger re-calculation of computed props dependent on currentMonth/Year
      console.log('Calendar attributes prepared, monthly metrics calculated, chart data will update.');
    },
    prepareCalendarAttributes() {
      const attributes = [];
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const occupiedOrUnavailableDateStrings = new Set();

      if (Array.isArray(this.bookings)) {
        this.bookings.forEach(booking => {
          if (booking.status_name === 'confirmed' || booking.status_name === 'active') {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            const localBookingStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
            const localBookingEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

            attributes.push({
              key: `booking-highlight-${booking.booking_id}`,
              highlight: { color: 'red', fillMode: 'solid' },
              dates: { start: localBookingStart, end: localBookingEnd },
              popover: { label: `Booked: ${booking.user_name || 'Guest'}`, visibility: 'hover' },
              order: 2 
            });
            let currentDateIterator = new Date(localBookingStart);
            while (currentDateIterator <= localBookingEnd) {
              occupiedOrUnavailableDateStrings.add(currentDateIterator.toISOString().split('T')[0]);
              currentDateIterator.setUTCDate(currentDateIterator.getUTCDate() + 1);
            }
          }
        });
      }

      if (Array.isArray(this.ownerUnavailabilities)) {
        this.ownerUnavailabilities.forEach(period => {
          const startDate = new Date(period.start_date);
          const endDate = new Date(period.end_date);
          const localStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
          const localEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
          
          attributes.push({
            key: `owner-unavailable-${period.unavailability_id}`,
            highlight: { color: 'gray', fillMode: 'light' }, 
            dates: { start: localStart, end: localEnd },
            popover: { label: period.reason ? `Unavailable: ${period.reason}` : 'Owner Unavailable', visibility: 'hover' },
            order: 1 
          });
          let currentDateIterator = new Date(localStart);
          while (currentDateIterator <= localEnd) { // Corrected loop condition
            occupiedOrUnavailableDateStrings.add(currentDateIterator.toISOString().split('T')[0]);
            currentDateIterator.setUTCDate(currentDateIterator.getUTCDate() + 1);
          }
        });
      }

      const availableDatesForDots = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const dayInMonth = new Date(Date.UTC(year, month, i));
        const dayString = dayInMonth.toISOString().split('T')[0];
        if (!occupiedOrUnavailableDateStrings.has(dayString)) {
          availableDatesForDots.push(dayInMonth);
        }
      }

      if (availableDatesForDots.length > 0) {
        attributes.push({
          key: 'available-days-dots',
          dot: { color: 'blue' },
          dates: availableDatesForDots,
          popover: { label: 'Available', visibility: 'hover' },
          order: 0 
        });
      }
      
      this.calendarAttributes = attributes;
    },
    async addUnavailability() {
      if (!this.newUnavailabilityRange.start || !this.newUnavailabilityRange.end) {
        alert('Please select a valid date range.');
        return;
      }
      this.isSubmittingUnavailability = true;
      try {
        const token = localStorage.getItem('token');
        const payload = {
          start_date: this.formatDateForAPI(this.newUnavailabilityRange.start),
          end_date: this.formatDateForAPI(this.newUnavailabilityRange.end),
          reason: this.newUnavailabilityReason,
        };
        await axios.post(`http://localhost:3001/locations/${this.locationId}/unavailability`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await this.fetchOwnerUnavailabilities();
        this.processBookingsAndUnavailabilityData(); 
        this.newUnavailabilityRange = { start: null, end: null };
        this.newUnavailabilityReason = '';
        alert('Unavailability period added successfully.');
      } catch (error) {
        console.error('Error adding unavailability:', error);
        alert(`Failed to add unavailability: ${error.response?.data?.error || error.message}`);
      } finally {
        this.isSubmittingUnavailability = false;
      }
    },
    async deleteUnavailability(unavailabilityId) {
      if (!confirm('Are you sure you want to delete this unavailability period?')) {
        return;
      }
      this.isDeletingUnavailability = unavailabilityId;
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/locations/${this.locationId}/unavailability/${unavailabilityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await this.fetchOwnerUnavailabilities();
        this.processBookingsAndUnavailabilityData();
        alert('Unavailability period deleted successfully.');
      } catch (error) {
        console.error('Error deleting unavailability:', error);
        alert(`Failed to delete unavailability: ${error.response?.data?.error || error.message}`);
      } finally {
        this.isDeletingUnavailability = null;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    },
    formatDateForAPI(date) {
      if (!date) return null;
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();
      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;
      return [year, month, day].join('-');
    },
    onDayClick(day) {
      console.log('Day clicked:', day);
      // Potentially show details for the clicked day, or use for other interactions
    },
    calculateMonthlyMetrics() {
      // This method is now primarily a placeholder or can be used
      // if there are metrics that are NOT reactive via computed properties
      // based on currentMonth/currentYear.
      // For now, the computed properties handle the monthly calculations reactively.
      console.log(`Recalculating metrics for ${this.currentMonth + 1}/${this.currentYear}`);
      // If you had non-computed properties that needed manual recalculation when month changes,
      // you would do that here. Example:
      // this.someNonComputedMetric = this.calculateSomeNonComputedMetric();
    },
    handleChartMonthClick(monthYearLabel) {
      console.log('handleChartMonthClick called with:', monthYearLabel);
      this.selectedMonthKey = monthYearLabel;
      
      const parts = monthYearLabel.split(' ');
      if (parts.length !== 2) {
        console.error('monthYearLabel format is incorrect:', monthYearLabel);
        this.bookingsInSelectedMonth = [];
        return;
      }
      const [monthName, yearString] = parts;
      const year = parseInt(yearString);
      const month = new Date(Date.parse(monthName + " 1, " + yearString)).getMonth();

      console.log('Parsed year:', year, 'Parsed month (0-indexed):', month);

      if (isNaN(year) || isNaN(month)) {
        console.error('Failed to parse year or month from:', monthYearLabel);
        this.bookingsInSelectedMonth = [];
        return;
      }

      this.bookingsInSelectedMonth = this.bookings.filter(booking => {
        const bookingStartDate = new Date(booking.start_date);
        const bookingMatches = bookingStartDate.getFullYear() === year && bookingStartDate.getMonth() === month;
        if (bookingMatches) {
          console.log('Booking matched:', booking);
        }
        return bookingMatches;
      });
      console.log('Bookings for selected month (', monthYearLabel, '):', this.bookingsInSelectedMonth);
      if (this.bookingsInSelectedMonth.length === 0) {
        console.log('No bookings found for', monthYearLabel);
      }
    },
    clearSelectedMonthBookings(){
      this.selectedMonthKey = null;
      this.bookingsInSelectedMonth = [];
    },
    resetToActualCurrentMonth() {
      const today = new Date();
      const actualCurrentYear = today.getFullYear();
      const actualCurrentMonth = today.getMonth(); // 0-indexed

      if (this.$refs.analyticsCalendar) {
        this.$refs.analyticsCalendar.move(new Date(actualCurrentYear, actualCurrentMonth));
        // The calendar move will trigger @update:from-page, which calls handlePageUpdate.
        // handlePageUpdate will set this.currentMonth and this.currentYear, and then call processBookingsAndUnavailabilityData.
      } else {
        // Fallback if ref is not available (should not happen ideally)
        this.currentMonth = actualCurrentMonth;
        this.currentYear = actualCurrentYear;
        this.debouncedProcessData();
      }
    }
  }
};
</script>

<style scoped>
.location-analytics-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInPage 1s ease-out;
}

@keyframes fadeInPage {
  from { opacity: 0; }
  to { opacity: 1; }
}

.back-button {
  margin-bottom: 20px;
  padding: 8px 15px;
  background-color: green;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  animation: slideInDown 0.8s ease-out;
}

@keyframes slideInDown {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.loading-message,
.error-message {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.loading-message {
  background-color: #e9f5f1;
  color: #42b983;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.analytics-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.card {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: popIn 0.6s ease-out forwards;
  opacity: 0;
  transform: scale(0.95);
}

.card:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* Staggered animation for cards */
.calendar-section.card { animation-delay: 0.2s; }
.stats-section.card { animation-delay: 0.4s; }

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.card h2, .card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.unavailability-form {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.date-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.date-input, .reason-input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  flex-grow: 1;
}

.date-separator {
  color: #555;
}

.unavailability-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.action-btn, .delete-btn, .clear-selection-btn, .btn-secondary {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.action-btn {
  background-color: #e74c3c; /* Red for unavailability */
  color: white;
}

.action-btn:hover {
  background-color: #c0392b;
}

.action-btn:disabled {
  background-color: #f5b7b1;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #f1c40f; /* Yellow for delete */
  color: #333;
}

.delete-btn:hover {
  background-color: #d4ac0d;
}

.delete-btn:disabled {
  background-color: #f9e79f;
  cursor: not-allowed;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-secondary {
  background-color: #3498db; /* Blue for secondary actions */
  color: white;
}

.btn-secondary:hover {
  background-color: #2980b9;
}

.clear-selection-btn {
  background-color: #95a5a6;
  color: white;
  margin-left: auto; /* Pushes button to the right if in a flex container */
  display: block; /* Or use flex on parent */
  margin-bottom: 10px;
}

.clear-selection-btn:hover {
  background-color: #7f8c8d;
}


/* Calendar Styles */
.vc-container {
  border: 1px solid #eaeaea;
  border-radius: 6px;
}

.calendar-legend {
  margin-top: 15px;
  display: flex;
  gap: 20px;
  justify-content: center;
  font-size: 0.9rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  border: 1px solid #ccc;
}

.color-box.available { background-color: #e6f7ff; } /* Light blue for available */
.color-box.occupied { background-color: #ffccc7; } /* Light red for booked */
.color-box.owner-unavailable { background-color: #e8e8e8; } /* Light grey for owner unavailable */

.existing-unavailabilities {
  margin-top: 20px;
}

.existing-unavailabilities ul {
  list-style: none;
  padding: 0;
}

.existing-unavailabilities li {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

/* Key Metrics */
.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.key-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-item {
  background-color: #fdfdfd;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.07);
}

.metric-item h3 {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #42b983;
  margin: 0;
}

.metric-value-pie {
  font-size: 1.3rem; /* Slightly smaller for pie chart context */
  font-weight: bold;
  color: #3498db; /* Different color for pie chart values */
  margin-top: 10px;
}

.chart-container-metric {
  padding-bottom: 10px; /* Ensure space for metric value below pie chart */
}

.chart-container-metric .vue-chartjs-pie {
  max-height: 120px; /* Control pie chart size */
  margin: 0 auto 10px auto; /* Center pie chart and add margin */
}

/* Main Chart */
.main-chart-container {
  height: 400px; /* Ensure enough height for the column chart */
  padding: 20px;
  background-color: #fdfdfd;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.no-chart-data,
.no-bookings-selected-month {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #777;
  margin-top: 20px;
}

/* Selected Month Bookings */
.selected-month-bookings {
  margin-top: 30px;
  padding: 20px;
  background-color: #e9f7ef; /* Light green background */
  border: 1px solid #d0e9d9;
  border-radius: 6px;
}

.selected-month-bookings h3 {
  color: #2c7a4d;
}

.selected-month-bookings ul {
  list-style: none;
  padding: 0;
}

.selected-month-bookings li {
  background-color: #fff;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.selected-month-bookings li strong {
  color: #333;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  h1 {
    font-size: 1.8rem;
  }

  .key-metrics-grid {
    grid-template-columns: 1fr; /* Stack metrics on smaller screens */
  }

  .date-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .date-separator {
    display: none;
  }

  .unavailability-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn, .reason-input {
    width: 100%;
  }
}
</style>

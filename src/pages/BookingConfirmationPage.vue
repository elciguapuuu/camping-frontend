<template>
  <div class="booking-confirmation">
    <h2>Booking Confirmed!</h2>
    <div class="confirmation-details">
      <h3>Booking Details</h3>
      <p>Location: {{ booking.locationName }}</p>
      <p>Check-in: {{ booking.startDate }}</p>
      <p>Check-out: {{ booking.endDate }}</p>
      <p>Total Price: €{{ booking.totalPrice }}</p>
    </div>
    <button @click="backToHome">Return to Home</button>
  </div>
</template>

<script>
export default {
  name: 'BookingConfirmationPage',
  data() {
    return {
      booking: {
        locationName: '',
        startDate: '',
        endDate: '',
        totalPrice: null
      }
    }
  },
  methods: {
    backToHome() {
      this.$router.push('/')
    }
  }
}
</script>

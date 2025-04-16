<template>
  <div class="location-details">
    <h2>{{ location.name }}</h2>
    <div class="location-info">
      <p>{{ location.description }}</p>
      <p>Price per night: €{{ location.price }}</p>
    </div>
    <button @click="startBooking">Book Now</button>
  </div>
</template>

<script>
export default {
  name: 'LocationDetailsPage',
  data() {
    return {
      location: {
        name: '',
        description: '',
        price: null
      }
    }
  },
  methods: {
    startBooking() {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login with return URL
        this.$router.push({
          path: '/login',
          query: { redirect: `/booking/${this.$route.params.id}` }
        });
      } else {
        // User is logged in, proceed to booking
        this.$router.push(`/booking/${this.$route.params.id}`);
      }
    }
  }
}
</script>

<template>
  <div class="manage-location">
    <h2>Manage Location</h2>
    <form @submit.prevent="handleSubmit">
      <input type="text" v-model="location.name" placeholder="Location Name">
      <textarea v-model="location.description" placeholder="Description"></textarea>
      <input type="number" v-model="location.price" placeholder="Price per night">
      <button type="submit">Save Location</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ManageLocationPage',
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
    handleSubmit() {
      // Save location logic will be implemented here
    }
  }
}
</script>

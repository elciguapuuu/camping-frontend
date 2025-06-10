# camping-app

## Project Overview
This is the frontend for Seeker, a camping spot rental platform. It is built with Vue.js.

## Installation
To get a local copy up and running, follow these simple steps.

1. **Install Vue CLI (if you haven't already)**:
   This project uses Vue CLI. If you don't have it installed, or want a specific version (e.g., 5.0.8), you can install or update it globally:
   ```sh
   npm install -g @vue/cli@5.0.8
   ```
   To check your current Vue CLI version, run:
   ```sh
   vue --version
   ```

2. Clone the repo:
   ```sh
   git clone https://github.com/elciguapuuu/camping-app/tree/v1
   ```
   
3. Navigate to the project directory:
   ```sh
   cd camping-app
   ```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```
This will typically start the development server on `http://localhost:8080`.

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Environment Variables
While this project primarily communicates with a backend service, ensure your backend is configured and running. The application expects the backend to be available at `http://localhost:3001` by default. If your backend is running on a different port, you may need to adjust API call URLs within the Vue components (typically in `src/services/api.js` or directly in components if a centralized API service isn't used).

### Key Features
- User registration and login (including Google OAuth via backend)
- Browsing and searching for camping locations
- Viewing location details, including images, amenities, and reviews
- Booking locations with date selection
- Leaving reviews for completed bookings
- User profile management, including viewing bookings and managing owned locations
- Adding and managing camping locations (for location owners)

### Usability Notes
- **User Accounts**: Users can register for an account or log in using Google. After logging in, users can book campsites, leave reviews, and manage their profile.
- **Location Owners**: Users who own locations can add new campsites, manage existing ones (edit details, upload images, set unavailability), and view analytics for their locations.
- **Booking Process**: Select dates on a location's detail page to initiate a booking. The system will guide you through the payment process (simulated or integrated with Stripe via the backend).
- **Reviews**: Users can only review locations where they have a completed booking.
- **Account Deactivation**: Users can choose to deactivate their account. This marks the account as inactive but retains data for historical purposes, rather than performing a hard delete.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
"# camping-frontend"

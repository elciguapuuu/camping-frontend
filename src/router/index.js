import Vue from 'vue'
import VueRouter from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import ManageLocationPage from '../pages/ManageLocationPage.vue'
import SearchResultsPage from '../pages/SearchResultsPage.vue'
import LocationDetailsPage from '../pages/LocationDetailsPage.vue'
import PurchaseBookingPage from '../pages/PurchaseBookingPage.vue'
import BookingConfirmationPage from '../pages/BookingConfirmationPage.vue'
import authGuard from './auth-guard'

Vue.use(VueRouter)

const routes = [
  { path: '/', name: 'HomePage', component: HomePage },
  { path: '/login', name: 'LoginPage', component: LoginPage },
  { path: '/register', name: 'RegisterPage', component: RegisterPage },
  { path: '/profile', name: 'ProfilePage', component: ProfilePage, beforeEnter: authGuard },
  { path: '/manage-location', name: 'ManageLocationPage', component: ManageLocationPage, beforeEnter: authGuard },
  { path: '/search', name: 'SearchResultsPage', component: SearchResultsPage },
  { path: '/location/:id', name: 'LocationDetailsPage', component: LocationDetailsPage },
  { path: '/booking/:id', name: 'PurchaseBookingPage', component: PurchaseBookingPage, beforeEnter: authGuard },
  { path: '/booking-confirmation', name: 'BookingConfirmationPage', component: BookingConfirmationPage, beforeEnter: authGuard }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// Handle OAuth callbacks
router.beforeEach((to, from, next) => {
  // Check for token in URL (for Google OAuth redirect)
  if (to.path === '/' && to.query.token) {
    const { token, userId, name, email, profilePictureUrl } = to.query;
    
    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: userId,
      name: name,
      email: email,
      profile_picture_url: profilePictureUrl || null
    }));
    
    // Clean up URL by removing query parameters
    next({ path: '/', query: {} });
  } else {
    next();
  }
});

export default router

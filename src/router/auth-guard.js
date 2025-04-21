/**
 * Auth Guard for protected routes
 * This middleware checks if the user is authenticated before allowing access to protected routes
 */

export default function authGuard(to, from, next) {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  if (isAuthenticated) {
    // If authenticated, allow access to the route
    next();
  } else {
    // If not authenticated, redirect to login with return URL
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }
}
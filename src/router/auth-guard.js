export default function authGuard(to, from, next) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login with return URL
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  } else {
    next();
  }
}
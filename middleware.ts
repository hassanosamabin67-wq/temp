import { NextResponse } from 'next/server';

export function middleware(request:any) {
  const url = request.nextUrl;
  
  // Check if the user is trying to access any profile page (e.g., /profile/[id])
  if (url.pathname.startsWith('/profile/')) {
    const isAuthenticated = checkAuth(request);

    if (!isAuthenticated) {
      // If not authenticated, redirect to the login page
      url.pathname = '/login'; // Change this to your actual login page route
      return NextResponse.redirect(url);
    }
  }

  // Allow all other pages
  return NextResponse.next();
}

// Mock function to check user authentication
function checkAuth(request:any) {
  // Example: Check for a cookie (you can replace this with your own logic)
  const authToken = request.cookies.get('userData');
  return authToken !== undefined;
}

export const config = {
  matcher: ['/profile/:path*'], // Match any route starting with /profile/
};

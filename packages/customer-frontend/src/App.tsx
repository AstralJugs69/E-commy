import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; // Import the layout
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderHistoryPage from './pages/OrderHistoryPage'; // Import the new page
import RequestPasswordResetPage from './pages/RequestPasswordResetPage'; // Import the new page
import ResetPasswordPage from './pages/ResetPasswordPage'; // Import the new page
import CustomerOrderDetailPage from './pages/CustomerOrderDetailPage'; // Import the new page
import ProfilePage from './pages/ProfilePage'; // Import the profile page
import WishlistPage from './pages/WishlistPage'; // Import the wishlist page
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext'; // Import WishlistProvider
import { Toaster } from 'react-hot-toast';
// Import other pages as needed

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster position="bottom-center" />
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Routes with layout */}
      <Route path="/" element={<Layout />}>
        {/* Index route for the homepage */}
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        {/* Product detail page */}
        <Route path="product/:productId" element={<ProductDetailPage />} />
        {/* Wishlist page - requires authentication */}
        <Route path="wishlist" element={isAuthenticated ? <WishlistPage /> : <Navigate to="/login" replace />} />
        {/* Checkout route - requires authentication */}
        <Route path="checkout" element={isAuthenticated ? <CheckoutPage /> : <Navigate to="/login" replace />} />
        {/* Order Success page - needs parameter later */}
        <Route path="order/success/:orderId" element={isAuthenticated ? <OrderSuccessPage /> : <Navigate to="/login" replace />} />
        {/* Add the new route for order history */}
        <Route path="orders" element={isAuthenticated ? <OrderHistoryPage /> : <Navigate to="/login" replace />} />
        {/* Add the new route for order detail */}
        <Route path="order/:orderId" element={isAuthenticated ? <CustomerOrderDetailPage /> : <Navigate to="/login" replace />} />
        {/* Add the profile page route */}
        <Route path="profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
        {/* Add other routes like product detail later */}

        {/* Optional: Catch-all within layout */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

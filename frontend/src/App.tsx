import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AudioPlayer } from './components/AudioPlayer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Public Pages
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { SongDetail } from './pages/SongDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Cart } from './pages/Cart';

// Customer Protected Pages
import { Library } from './pages/Library';
import { Account } from './pages/Account';

// Admin Protected Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSongs } from './pages/AdminSongs';
import { AdminNewSong } from './pages/AdminNewSong';
import { AdminOrders } from './pages/AdminOrders';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AudioPlayerProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-studio-dark text-white selection:bg-studio-accent selection:text-white">
              {/* Header Navigation */}
              <Navbar />
              
              {/* Main Content Area */}
              <main className="flex-grow">
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<Home />} />
                  <Route path="/songs" element={<Catalog />} />
                  <Route path="/songs/:id" element={<SongDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />

                  {/* Customer Guarded Pages */}
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <Library />
                    </ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  } />

                  {/* Studio Admin Guarded Pages */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/songs" element={
                    <AdminRoute>
                      <AdminSongs />
                    </AdminRoute>
                  } />
                  <Route path="/admin/songs/new" element={
                    <AdminRoute>
                      <AdminNewSong />
                    </AdminRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <AdminRoute>
                      <AdminOrders />
                    </AdminRoute>
                  } />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />

              {/* Persistent Docked Audio Player */}
              <AudioPlayer />
            </div>
          </CartProvider>
        </AudioPlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

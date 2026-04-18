/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import Itinerary from './pages/Itinerary';
import Chat from './pages/Chat';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import Destinations from './pages/Destinations';
import Recommendations from './pages/Recommendations';
export default function App() {
  return (
    <Router>
      <div className="bg-surface text-on-surface min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/detail" element={<Detail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

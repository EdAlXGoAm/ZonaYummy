
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import AdminPage from './routes/adminPage';

const LoadingScreen = () => {
  const logoFondo = '/FondoLisoPastelVertical-min.png';
  const logo = '/LoadingScreen-min.png';
  return (
    <div className="LoadingScreen">
      <header className="Load-header">
        <img src={logoFondo} className="Load-bkground" alt="logo_bkg" />
        <img src={logo} className="Load-logo" alt="logo" />
      </header>
    </div>
  );
};

const MainScreen = () => {
  return (
    <div className="MainScreen"></div>
  );
};

const AdminScreen = () => {
  return(<AdminPage />);
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={loading ? <LoadingScreen /> : <MainScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;


import './App.css';
import React, { useState, useEffect } from 'react';

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
    <div className="MainScreen">
      <p class="fs-4 fs-lg-2">Este es un texto responsivo.</p>
    </div>
  );
}

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return loading ? <LoadingScreen /> : <MainScreen />;
}

export default App;

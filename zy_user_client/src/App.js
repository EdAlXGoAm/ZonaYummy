
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import AdminPage from './routes/adminPage';
import MeseroPage from './routes/MeseroPage';
import MeseroPageTest from './routes/MeseroPageTest';
import CocinaBebidasPage from './routes/CocinaBebidasPage';
import CocinaNewFeaturesPage from './routes/CocinaNewFeaturesPage';
import CocinadoPage from './routes/CocinadoPage';
import AutorizacionBorradosPage from './routes/AutorizacionBorradosPage';
import Menu from './routes/Menu';

const LoadingScreen = () => {
  const logoFondo = '/FondoLisoPastelVertical-min.png';
  const logo = '/Ideogram/Full.png';
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
      <Menu />
    </div>
  );
};

const AdminScreen = () => {
  return(<AdminPage />);
};

const MeseroScreen = ({modeInterface}) => {
  return (
    <MeseroPage modeInterface={modeInterface}/>
  );
}

const MeseroScreenTest = ({modeInterface}) => {
  return (
    <MeseroPageTest modeInterface={modeInterface}/>
  );
}

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
        <Route path="/Menu" element={<MainScreen />}/>
        <Route path="/2on4yummy-admin" element={<AdminScreen />} />
        <Route path="/2on4yummy-mesero" element={<MeseroScreen modeInterface={true} />} />
        <Route path="/2on4yummy-mesero-test" element={<MeseroScreenTest modeInterface={true} />} />
        <Route path="/2on4yummy-cocina" element={<MeseroScreen modeInterface={false} />} />
        <Route path="/2on4yummy-cocina-test" element={<MeseroScreenTest modeInterface={false} />} />
        <Route path="/2on4yummy-cocinabebidas" element={<CocinaBebidasPage />} />
        <Route path="/cocina_new_features" element={<CocinaNewFeaturesPage />} />
        <Route path="/cocinado" element={<CocinadoPage />} />
        <Route path="/eliminar" element={<AutorizacionBorradosPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;

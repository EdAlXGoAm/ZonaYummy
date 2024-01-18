import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const NavbarLogo = () => {
    const logo = '/Logo Nav Bar-min.png';
    return (
        <div title="Zona Yummy" className="navbar-brand">
            <img src={logo} className="navbar-logo" alt="logo" />
        </div>
    );
}

const NavbarButtonMenu = () => {
    return (
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span><FontAwesomeIcon className="navbar-toggler-icon" icon={faBars} size="lg" /></span>
        </button>
    );
}

const NavbarLinks = () => {
    return (
        // navbarNav debe ir alineado a la derecha
        <div class="ml-auto" id="navbarNav">
            {/* Derecha */}
            <ul className="navbar-nav">
                <li class="nav-item">
                    <a title="Inicio" className="nav-link" href="/">Inicio</a></li>
                <li class="nav-item">
                    <a title="Menú" className="nav-link" href="/Menu/">Menú</a></li>
                <li class="nav-item"> 
                    <a title="Contacto" className="nav-link" href="/Contacto/">Contacto</a></li>
            </ul>
        </div>
    );
}

const NavbarSession = () => {
    return (
        <div class="" id="navbarSession">
            <ul className="navbar-nav">
                <li class="nav-item">
                    <button type="button" class="btn btn-outline-light">Regístrate</button>
                </li>
                <li class="nav-item">
                    <button type="button" class="btn btn-light">Inicia Sesión</button>
                </li>
            </ul>
        </div>
    );
}


const Header = () => {
    return (
        <div className="Header">
            <nav className="navbar navbar-expand-lg navbar-style">
                {/* Logo */}
                <NavbarLogo />
                {/* Botón menú desplegable */}
                <NavbarButtonMenu />
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    {/* Links */}
                    <NavbarLinks />

                    {/* Botones */}
                    <NavbarSession />
                </div>

            </nav>
        </div>
    );
};
export default Header;
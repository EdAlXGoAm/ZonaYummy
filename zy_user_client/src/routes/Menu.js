import React, { useState, useEffect } from 'react';
import './Menu.css'

const Menu = () => {
    const numberOfPages = 9;
    const menuImageDir = '/images/menu/menu-postres-';

    const [counterPage, setCounterPage] = useState(1);
    
    const handleNextPage = () => {
        setCounterPage(counterPage + 2 <= numberOfPages ? counterPage + 2 : counterPage);
    }

    const handlePrevPage = () => {
        setCounterPage(counterPage - 2 > 1 ? counterPage - 2 : 1);
    }

    const renderMenuPages = () => {
        for (let i = counterPage; i < counterPage + 2; i++) {
            if (counterPage < numberOfPages && counterPage + 1 <= numberOfPages){
                return (
                    <div className="row">
                        <div className="col-md">
                            <img src={`${menuImageDir}${counterPage}.png`} className="imgMenuPage" alt="Menú" />
                        </div>
                        <div className="col-md">
                            <img src={`${menuImageDir}${counterPage + 1}.png`} className="imgMenuPage" alt="Menú" />
                        </div>
                    </div>
                );
            }
            else if (counterPage <= numberOfPages){
                return (
                    <div className="row">
                        <div className="col-md">
                            <img src={`${menuImageDir}${counterPage}.png`} className="imgMenuPage" alt="Menú" />
                        </div>
                        <div className="col-md">
                        </div>
                    </div>
                );
            }
        }
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-2">
                    <div className="form-group" style={{margin: 'auto', width: '50%', paddingBottom: '15px'}}>
                        <button onClick={handlePrevPage} className="btn btn-primary" style={{backgroundColor: '#e073aa', border: '#e073aa'}}>{`<<`}</button>
                    </div>
                </div>
                <div className="col-8" style={{margin: 'auto', width: '50%', paddingBottom: '15px'}}>
                    {/* {counterPage} */}
                </div>
                <div className="col-2">
                    <div className="form-group" style={{margin: 'auto', width: '50%', paddingBottom: '15px'}}>
                        <button onClick={handleNextPage} className="btn btn-primary" style={{backgroundColor: '#2498a0', border: '#2498a0'}}>{`>>`}</button>
                    </div>
                </div>
            </div>
            {renderMenuPages()}
        </div>
    );
};

export default Menu;
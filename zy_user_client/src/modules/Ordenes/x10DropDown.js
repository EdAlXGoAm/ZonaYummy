import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const DropDown = ({ opciones_in, selectedValue, onDropdownChange, prefix, precios_papas, hide_show_toggle, setToggleChecked }) => {

  const handleSelectChange = (option) => {
    const costt = option.label.props.children[0].props.children.replace('$', '')
    // Convertir costt en int
    const costt_int = parseInt(costt, 10)

    // Aquí puedes manejar y transformar la opción seleccionada como desees
    const customValue = {
      value: option.value,
      precio: costt_int,
    };

    // Luego llamas a handleChange con tu valor personalizado
    onDropdownChange(customValue);
  }

  // Asignar opciones_in directamente a opciones
  const opcionesPredeterminadas = ['Opciones'];
  const opciones_dropdown = opciones_in && opciones_in.length > 0 ? opciones_in : opcionesPredeterminadas;

  const options = opciones_dropdown.map((opcion_dropdown, index) => ({
    value: opcion_dropdown,//.toLowerCase().replace(/\s/g, '_'),
    label: (
      <div style={{ display: 'flex', justifyContent: 'left' }}>
            <span style={{ color: 'red' }}>
            {hide_show_toggle
              ? (precios_papas && precios_papas.length > 0 ? `$${precios_papas[index]} ` : '')
              : (prefix && prefix.length > 0 ? prefix[index] !== 0 ? `$${prefix[index]} ` : '' : '')}
            </span>
            <span style={{ color: 'black' }}>
            &nbsp;{opcion_dropdown}
            </span>
      </div>
    )
    ,
  }));

  const MyComponent = ({selectedValue, handleChange}) => (
    <div className="mb-3" style={{ fontWeight: 'bold', fontSize: '23px' }}>
      {/* set selectedValue has selected option */}
      <Select
      options={options}
      value={options.find(obj => obj.value === selectedValue)}
      onChange={handleChange}
      isSearchable={false}
      />
    </div>
  )

  return (
    <div>
      <MyComponent selectedValue={selectedValue} handleChange={handleSelectChange} />
    </div>
  );
};

export default DropDown;

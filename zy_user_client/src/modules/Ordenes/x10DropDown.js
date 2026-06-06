import React, { useMemo, useCallback } from 'react';
import Select from 'react-select';

const resolvePrecio = (index, { prefix, precios_papas, hide_show_toggle }) => {
    if (hide_show_toggle) {
        return precios_papas?.[index] ?? 0;
    }
    if (prefix?.length > 0 && prefix[index] !== 0) {
        return prefix[index];
    }
    return 0;
};

const DropDown = ({
    opciones_in,
    selectedValue,
    onDropdownChange,
    prefix,
    precios_papas,
    hide_show_toggle,
}) => {
    const opcionesPredeterminadas = ['Opciones'];
    const opcionesDropdown = opciones_in?.length > 0 ? opciones_in : opcionesPredeterminadas;

    const options = useMemo(
        () => opcionesDropdown.map((opcion, index) => {
            const precio = resolvePrecio(index, { prefix, precios_papas, hide_show_toggle });
            return {
                value: opcion,
                precio,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'left' }}>
                        <span style={{ color: 'red' }}>
                            {precio !== 0 ? `$${precio} ` : ''}
                        </span>
                        <span style={{ color: 'black' }}>
                            &nbsp;{opcion}
                        </span>
                    </div>
                ),
            };
        }),
        [opcionesDropdown, prefix, precios_papas, hide_show_toggle]
    );

    const selectedOption = useMemo(
        () => options.find((obj) => obj.value === selectedValue) ?? null,
        [options, selectedValue]
    );

    const handleSelectChange = useCallback((option) => {
        if (!option) return;
        onDropdownChange({
            value: option.value,
            precio: option.precio ?? 0,
        });
    }, [onDropdownChange]);

    return (
        <div
            className="mb-3 mesero-dropdown-wrap"
            style={{ fontWeight: 'bold', fontSize: '23px' }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <Select
                options={options}
                value={selectedOption}
                onChange={handleSelectChange}
                isSearchable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                closeMenuOnScroll={false}
                menuShouldScrollIntoView={false}
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10100 }),
                }}
            />
        </div>
    );
};

export default DropDown;

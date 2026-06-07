import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import Select, { components } from 'react-select';
import { bindTouchAxisScroll } from './Mesero/meseroTouchAxisScroll';

const resolvePrecio = (index, { prefix, precios_papas, hide_show_toggle }) => {
    if (hide_show_toggle) {
        return precios_papas?.[index] ?? 0;
    }
    if (prefix?.length > 0 && prefix[index] !== 0) {
        return prefix[index];
    }
    return 0;
};

const TouchMenuList = (props) => {
    const listRef = useRef(null);

    useEffect(() => {
        const el = listRef.current;
        if (!el) {
            return undefined;
        }
        return bindTouchAxisScroll(el, { axis: 'y' });
    }, [props.selectProps.menuIsOpen]);

    return (
        <components.MenuList
            {...props}
            innerRef={(node) => {
                listRef.current = node;
                const { innerRef } = props;
                if (typeof innerRef === 'function') {
                    innerRef(node);
                } else if (innerRef) {
                    innerRef.current = node;
                }
            }}
            innerProps={{
                ...props.innerProps,
                'data-mesero-select-menu': 'true',
            }}
        />
    );
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
            data-touch-scroll-exempt
            style={{ fontWeight: 'bold', fontSize: '23px' }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Select
                options={options}
                value={selectedOption}
                onChange={handleSelectChange}
                isSearchable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuShouldBlockScroll={false}
                captureMenuScroll={false}
                closeMenuOnScroll={false}
                menuShouldScrollIntoView={false}
                components={{ MenuList: TouchMenuList }}
                styles={{
                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 10100,
                        pointerEvents: 'auto',
                    }),
                    menuList: (base) => ({
                        ...base,
                        maxHeight: 220,
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y',
                    }),
                }}
            />
        </div>
    );
};

export default DropDown;

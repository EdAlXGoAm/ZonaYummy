import './AddPlatilloForm.css'
import checkbox_css from './checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css
import React, { useState, useEffect, useRef, useMemo } from 'react';
import platillosApi from './../../api/platillosApi';

const createEmptyPlatillo = (platilloId = '') => ({
    PlatilloId: platilloId,
    Categoria: '',
    NombrePlatillo: '',
    Descripcion: '',
    Imagen: '',
    Disponibilidad: '',
    SelectedVariant: 0,
    Variants: []
});

const normalizeComponente = (componente = {}) => ({
    Name: componente?.Name ?? '',
    Precio: componente?.Precio ?? 0,
    Checked: componente?.Checked ?? true
});

const normalizeOpcionItem = (item = {}) => ({
    Name: item?.Name ?? '',
    Precio: item?.Precio ?? 0
});

const normalizeOpcion = (opcion = {}) => ({
    Name: opcion?.Name ?? '',
    SelectedItem: opcion?.SelectedItem ?? 0,
    Items: Array.isArray(opcion?.Items) ? opcion.Items.map(normalizeOpcionItem) : []
});

const normalizeIngredienteItemCantidad = (cantidad = {}) => ({
    Name: cantidad?.Name ?? ''
});

const normalizeIngredienteItem = (item = {}) => ({
    Checked: item?.Checked ?? false,
    Name: item?.Name ?? '',
    SelectedCantidad: item?.SelectedCantidad ?? 0,
    ItemCantidad: Array.isArray(item?.ItemCantidad) ? item.ItemCantidad.map(normalizeIngredienteItemCantidad) : []
});

const normalizeIngrediente = (ingrediente = {}) => ({
    Type: ingrediente?.Type ?? 'CB',
    Name: ingrediente?.Name ?? '',
    SelectedItem: ingrediente?.SelectedItem ?? 0,
    Items: Array.isArray(ingrediente?.Items) ? ingrediente.Items.map(normalizeIngredienteItem) : []
});

const normalizeExtra = (extra = {}) => ({
    Checked: extra?.Checked ?? false,
    Extra: extra?.Extra ?? '',
    SelectedOpcion: extra?.SelectedOpcion ?? 0,
    Opciones: Array.isArray(extra?.Opciones) ? extra.Opciones : [],
    SelectedCantidad: extra?.SelectedCantidad ?? 0,
    Cantidad: Array.isArray(extra?.Cantidad) ? extra.Cantidad : [],
    Precio: extra?.Precio ?? 0
});

const normalizeAdicional = (adicional = {}) => ({
    Checked: adicional?.Checked ?? false,
    Adicional: adicional?.Adicional ?? '',
    SelectedOpcion: adicional?.SelectedOpcion ?? 0,
    Opciones: Array.isArray(adicional?.Opciones) ? adicional.Opciones : [],
    SelectedCantidad: adicional?.SelectedCantidad ?? 0,
    Cantidad: Array.isArray(adicional?.Cantidad) ? adicional.Cantidad : [],
    Precio: adicional?.Precio ?? 0
});

const normalizeVariant = (variant = {}) => ({
    VariantName: variant?.VariantName ?? '',
    Precio: variant?.Precio ?? 0,
    Componentes: Array.isArray(variant?.Componentes) ? variant.Componentes.map(normalizeComponente) : [],
    Opciones: Array.isArray(variant?.Opciones) ? variant.Opciones.map(normalizeOpcion) : [],
    Ingredientes: Array.isArray(variant?.Ingredientes) ? variant.Ingredientes.map(normalizeIngrediente) : [],
    Extras: Array.isArray(variant?.Extras) ? variant.Extras.map(normalizeExtra) : [],
    Adicionales: Array.isArray(variant?.Adicionales) ? variant.Adicionales.map(normalizeAdicional) : []
});

const normalizePlatillo = (value = {}) => ({
    PlatilloId: value?.PlatilloId ?? '',
    Categoria: value?.Categoria ?? '',
    NombrePlatillo: value?.NombrePlatillo ?? '',
    Descripcion: value?.Descripcion ?? '',
    Imagen: value?.Imagen ?? '',
    Disponibilidad: value?.Disponibilidad ?? '',
    SelectedVariant: value?.SelectedVariant ?? 0,
    Variants: Array.isArray(value?.Variants) ? value.Variants.map(normalizeVariant) : []
});

const COLLAPSED_CATEGORIES_LS = 'zy_admin_platillo_categoria_collapsed_v1';

const readCollapsedCategories = () => {
    try {
        const raw = localStorage.getItem(COLLAPSED_CATEGORIES_LS);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

const writeCollapsedCategories = (collapsedSet) => {
    localStorage.setItem(COLLAPSED_CATEGORIES_LS, JSON.stringify([...collapsedSet]));
};

const AddPlatilloForm = ({
    onClose, 
    mode = "both", // "list" | "form" | "both"
    onEditRequest, // callback cuando se hace clic en editar desde la lista
    editPlatilloId = null, // ID del platillo a editar (para cargar desde afuera)
    initialCategoria = '',
    onPlatillosUpdate, // callback para sincronizar la lista externa
    onRegisterListRefresh, // exposes fetchPlatillos to parent (list mode)
    onSaved, // called after successful add/update
}) => {
    const [platillo, setPlatillo] = useState(createEmptyPlatillo());
    const [platillosList, setPlatillosList] = useState([]);
    const [collapsedCategorias, setCollapsedCategorias] = useState(() => readCollapsedCategories());
    const [buttonAction, setButtonAction] = useState("Agregar")
    const [jsonDraft, setJsonDraft] = useState(JSON.stringify(createEmptyPlatillo(), null, 2));
    const [jsonIsDirty, setJsonIsDirty] = useState(false);
    const [jsonError, setJsonError] = useState('');
    const [movingPlatilloId, setMovingPlatilloId] = useState(null);
    const jsonLineNumbersRef = useRef(null);
    const platilloJson = useMemo(() => JSON.stringify(platillo, null, 2), [platillo]);
    const jsonLineNumbers = useMemo(
        () => jsonDraft.split('\n').map((_, index) => index + 1).join('\n'),
        [jsonDraft]
    );

    const fetchResetPlatillo = () => {
        setPlatillo(createEmptyPlatillo())
    }

    useEffect(() => {
        if (!jsonIsDirty) {
            setJsonDraft(platilloJson);
            setJsonError('');
        }
    }, [platilloJson, jsonIsDirty]);

    const handleToggleButtonAction = () => {
        buttonAction === "Actualizar"
        ? setButtonAction("Agregar")
        : setButtonAction("Agregar")
    }

    const platillosMaxId = useMemo(() => {
        if (!platillosList.length) return 0;
        return Math.max(...platillosList.map((p) => Number(p.PlatilloId) || 0));
    }, [platillosList]);

    const fetchPlatilloId = () => {
        platillosApi.getLastPlatilloId()
        .then((data) => {
            const nextId = Math.max(Number(data) || 0, platillosMaxId) + 1;
            setPlatillo((prevPlatillo) => ({ ...prevPlatillo, PlatilloId: nextId }));
        });
    };

    useEffect(() => {
        // Only suggest a new ID when creating, not when editing an existing platillo
        if (editPlatilloId === null || editPlatilloId === undefined) {
            fetchPlatilloId();
        }
    }, [editPlatilloId, platillosMaxId]);

    const showList = mode === "list" || mode === "both";
    const showForm = mode === "form" || mode === "both";

    const fetchPlatillos = () => {
        const scrollY = showList ? window.scrollY : null;
        platillosApi.getPlatillos()
        .then(data => {
            setPlatillosList(data);
            if (onPlatillosUpdate) {
                onPlatillosUpdate(data);
            }
            if (scrollY !== null) {
                requestAnimationFrame(() => {
                    window.scrollTo(0, scrollY);
                });
            }
        })
    };

    useEffect(() => {
        if (!onRegisterListRefresh || !showList) {
            return undefined;
        }
        onRegisterListRefresh(fetchPlatillos);
        return () => onRegisterListRefresh(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRegisterListRefresh, showList]);

    useEffect (() => {
        fetchPlatillos();
    }, []);

    // Cargar platillo a editar cuando se pasa editPlatilloId desde afuera
    useEffect(() => {
        if (editPlatilloId !== null && editPlatilloId !== undefined) {
            setPlatillo(prevPlatillo => ({
                ...prevPlatillo,
                PlatilloId: editPlatilloId,
                Categoria: initialCategoria || prevPlatillo.Categoria
            }));
            fetchPlatilloToEdit(editPlatilloId);
        }
    }, [editPlatilloId, initialCategoria]);

    // Agrupar platillos por categoría y ordenar por ID
    const platillosAgrupados = useMemo(() => {
        const grupos = {};
        platillosList.forEach(platillo => {
            const categoria = platillo.Categoria || 'Sin Categoría';
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(platillo);
        });
        // Ordenar por ID dentro de cada categoría
        Object.keys(grupos).forEach(categoria => {
            grupos[categoria].sort((a, b) => {
                const idA = parseInt(a.PlatilloId) || 0;
                const idB = parseInt(b.PlatilloId) || 0;
                return idA - idB;
            });
        });
        return grupos;
    }, [platillosList]);

    const categoriasPlatillos = useMemo(() => Object.keys(platillosAgrupados).sort(), [platillosAgrupados]);

    const toggleCategoriaCollapsed = (categoria) => {
        setCollapsedCategorias((prev) => {
            const next = new Set(prev);
            if (next.has(categoria)) next.delete(categoria);
            else next.add(categoria);
            writeCollapsedCategories(next);
            return next;
        });
    };

    // Función para generar IDs faltantes entre dos platillos
    const getMissingIds = (startId, endId) => {
        const missing = [];
        for (let i = startId + 1; i < endId; i++) {
            missing.push(i);
        }
        return missing;
    };

    // Función auxiliar para verificar si un ID ya existe en la lista completa de platillos
    const platilloIdExists = (id) => {
        return platillosList.some(platillo => parseInt(platillo.PlatilloId) === id);
    };

    const getNextAvailablePlatilloId = (currentId, direction) => {
        const current = Number(currentId);
        if (!Number.isFinite(current)) return null;

        const occupied = new Set(
            platillosList
                .map((platillo) => Number(platillo.PlatilloId))
                .filter((id) => Number.isFinite(id) && id !== current),
        );

        if (direction === 'forward') {
            let candidate = current + 1;
            while (occupied.has(candidate)) {
                candidate += 1;
            }
            return candidate;
        }

        let candidate = current - 1;
        while (candidate >= 1 && occupied.has(candidate)) {
            candidate -= 1;
        }
        return candidate >= 1 && !occupied.has(candidate) ? candidate : null;
    };

    const handleMovePlatilloId = (platilloData, direction) => {
        const currentId = Number(platilloData?.PlatilloId);
        const nextId = getNextAvailablePlatilloId(currentId, direction);
        if (!Number.isFinite(currentId) || !Number.isFinite(nextId)) {
            alert(direction === 'backward'
                ? 'No hay un ID disponible hacia atras.'
                : 'No se pudo calcular el siguiente ID.');
            return;
        }

        const confirmMove = window.confirm(
            `Mover "${platilloData.NombrePlatillo || 'platillo'}" del ID #${currentId} al #${nextId}?`,
        );
        if (!confirmMove) return;

        setMovingPlatilloId(currentId);
        platillosApi.movePlatilloId(currentId, nextId)
            .then(() => {
                fetchPlatillos();
            })
            .catch((err) => {
                const msg = err.response?.data?.error || err.message || 'Error al mover el ID';
                alert(msg);
            })
            .finally(() => {
                setMovingPlatilloId(null);
            });
    };

    // Función para crear un array mezclado de platillos y botones de IDs faltantes
    const createPlatillosWithButtons = (platillos) => {
        if (platillos.length === 0) return [];

        const result = [];

        const pushGapButton = (id) => {
            if (!platilloIdExists(id)) {
                result.push({ type: 'button', id });
            }
        };
        
        const firstId = parseInt(platillos[0].PlatilloId) || 0;
        const lastId = parseInt(platillos[platillos.length - 1].PlatilloId) || 0;
        
        // Agregar botón antes del primer platillo si el ID anterior no existe
        if (firstId > 1) {
            pushGapButton(firstId - 1);
        }
        
        // Agregar el primer platillo
        result.push({ type: 'platillo', data: platillos[0] });
        
        // Para cada par de platillos consecutivos, verificar IDs faltantes
        for (let i = 1; i < platillos.length; i++) {
            const prevId = parseInt(platillos[i - 1].PlatilloId) || 0;
            const currentId = parseInt(platillos[i].PlatilloId) || 0;
            
            // Si hay IDs faltantes entre ellos, agregar solo el siguiente al primero y el anterior al segundo
            if (currentId - prevId > 1) {
                pushGapButton(prevId + 1);
                if (currentId - prevId > 2) {
                    pushGapButton(currentId - 1);
                }
            }
            
            // Agregar el platillo actual
            result.push({ type: 'platillo', data: platillos[i] });
        }
        
        // Agregar botón después del último platillo si el ID siguiente no existe
        pushGapButton(lastId + 1);
        
        return result;
    };

    const fetchPlatilloToEdit = (id) => {
        platillosApi.getPlatillo(id)
        .then(data => {
            const platilloEncontrado = Array.isArray(data) ? data[0] : data;

            if (!platilloEncontrado || platilloEncontrado.PlatilloId === undefined || platilloEncontrado.PlatilloId === null || platilloEncontrado.PlatilloId === '') {
                setPlatillo(normalizePlatillo({
                    ...createEmptyPlatillo(id),
                    Categoria: initialCategoria || ''
                }));
                setButtonAction("Agregar");
                return;
            }

            setPlatillo(normalizePlatillo(platilloEncontrado))
            setButtonAction("Actualizar")
        })
        .catch(() => {
            // Si el platillo no existe, crear uno nuevo con ese ID
            setPlatillo(normalizePlatillo({
                ...createEmptyPlatillo(id),
                Categoria: initialCategoria || ''
            }))
            setButtonAction("Agregar")
        })
    };
    
    const handleEditPlatillo = (id, categoria = '') => {
        // Si hay callback onEditRequest, llamarlo (para abrir modal desde lista externa)
        if (onEditRequest) {
            onEditRequest(id, categoria);
        } else {
            fetchPlatilloToEdit(id);
        }
    };

    const handleDeletePlatillo = (id) => {
        platillosApi.deletePlatillo(id)
        .then(data => {
            fetchPlatillos();
        })
    };

    const getDisponibilidadClass = (value) => {
        const disponibilidad = Number(value);
        if (disponibilidad > 0) return 'disponible';
        if (disponibilidad === 0) return 'agotado';
        return 'ilimitado';
    };

    const handleDisponibilidadDoubleClick = (platilloData) => {
        const current = Number(platilloData.Disponibilidad);
        const nextDisponibilidad = current === 0 ? -1 : 0;
        platillosApi.updatePlatillo({ ...platilloData, Disponibilidad: nextDisponibilidad })
            .then(() => {
                fetchPlatillos();
            })
            .catch(() => {
                alert('Error al actualizar disponibilidad');
            });
    };

    const handleInputChange = (e) => {
        setPlatillo(prevPlatillo => { 
            const newPlatillo = { ...prevPlatillo, [e.target.id]: e.target.value };
            return newPlatillo;
        });
    };

    const addVariant = () => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
            Variants: [...platillo.Variants, { VariantName: '', Precio: 0, Componentes: [], Opciones: [], Ingredientes: [], Extras: [], Adicionales: [] }]}
            return newPlatillo;
        });
    };

    const handleVariantChange = (index, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === index) {
                return { ...variant, [event.target.id]: event.target.value };
            }
            return variant;
        });
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: newVariants }
            return newPlatillo;
        });
    };

    const removeVariant = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: [
                ...platillo.Variants.slice(0, index),
                ...platillo.Variants.slice(index + 1)]
            };
            return newPlatillo;
        });
    };

    const addVariantComponente = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [
                    ...platillo.Variants.slice(0, index),
                    {
                        ...platillo.Variants[index],
                        Componentes: [
                            ...platillo.Variants[index].Componentes,
                            {
                                Name: '',
                                Precio: 0,
                                Checked: true
                            }
                        ]
                    },
                    ...platillo.Variants.slice(index+1)
                ]
            }
            return newPlatillo;
        });
    };

    const handleVariantComponente = (indexVariant, indexComponente, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === indexVariant) {
                const newComponente = variant.Componentes.map((componente, idx) => {
                    if (idx === indexComponente) {
                        if (event.target.id === "Checked"){
                            return { ...componente, [event.target.id]: event.target.checked };
                        }
                        else {
                            return { ...componente, [event.target.id]: event.target.value };
                        }
                    }
                    return componente;
                });
                return { ...variant, Componentes: newComponente };
            }
            return variant;
        });
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: newVariants }
            return newPlatillo;
        });
    };

    const removeVariantComponente = (indexVariant, indexComponente) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: [
                ...platillo.Variants.slice(0, indexVariant), {
                    ...platillo.Variants[indexVariant], Componentes: [
                        ...platillo.Variants[indexVariant].Componentes.slice(0, indexComponente),
                        ...platillo.Variants[indexVariant].Componentes.slice(indexComponente + 1)]
                }, ...platillo.Variants.slice(indexVariant + 1)]}
            return newPlatillo;
        });
    };

    const addVariantOpcion = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [
                    ...platillo.Variants.slice(0, index),
                    {
                        ...platillo.Variants[index],
                        Opciones: [
                            ...platillo.Variants[index].Opciones,
                            {
                                Name: '',
                                SelectedItem: 0,
                                Items: [ {Name: '', Precio: 0} ]
                            }
                        ] 
                    },
                    ...platillo.Variants.slice(index + 1)
                ]
            }
            return newPlatillo;
        });
    };

    const handleVariantOpcion = (indexVariant, indexOption, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === indexVariant) {
                const newOpciones = variant.Opciones.map((opcion, idx) => {
                    if (idx === indexOption) {
                        return { ...opcion, [event.target.id]: event.target.value };
                    }
                    return opcion;
                });
                return { ...variant, Opciones: newOpciones };
            }
            return variant;
        });
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: newVariants }
            return newPlatillo;
        });
    };

    const removeVariantOpcion = (indexVariant, indexOpcion) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Opciones: [...platillo.Variants[indexVariant].Opciones.slice(0, indexOpcion), ...platillo.Variants[indexVariant].Opciones.slice(indexOpcion + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
            return newPlatillo;
        });
    };

    const addVarianOptionItem = (index, indexOpcion) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [
                    ...platillo.Variants.slice(0, index),
                    {
                        ...platillo.Variants[index],
                        Opciones: [
                            ...platillo.Variants[index].Opciones.slice(0, indexOpcion),
                            {
                                ...platillo.Variants[index].Opciones[indexOpcion],
                                Items: [
                                    ...platillo.Variants[index].Opciones[indexOpcion].Items,
                                    {
                                        Name: '',
                                        Precio: 0
                                    }
                                ]
                            },
                            ...platillo.Variants[index].Opciones.slice(indexOpcion + 1)
                        ]
                    },
                    ...platillo.Variants.slice(index + 1)
                ]
            }
            return newPlatillo;
        });
    };

    const handleVariantOptionItem = (indexVariant, indexOption, indexItem, event) =>{
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newOpciones = variant.Opciones.map((opcion, idx) => {
                        if (idx === indexOption) {
                            const newItems = opcion.Items.map((item, idx) => {
                                if (idx === indexItem) {
                                    return { ...item, [event.target.id]: event.target.value };
                                }
                                return item;
                            });
                            return { ...opcion, Items: newItems };
                        }
                        return opcion;
                    });
                    return { ...variant, Opciones: newOpciones };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const removeVariantOptionItem = (indexVariant, indexOption, indexItem) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newOpciones = variant.Opciones.map((opcion, idx) => {
                        if (idx === indexOption) {
                            const newItems = opcion.Items.filter((_, idx) => idx !== indexItem);
                            return { ...opcion, Items: newItems };
                        }
                        return opcion;
                    });
                    return { ...variant, Opciones: newOpciones };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const addVariantIngrediente = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = {
                ...platillo, Variants: [
                    ...platillo.Variants.slice(0, index), {
                        ...platillo.Variants[index], Ingredientes: [
                            ...platillo.Variants[index].Ingredientes, { Type: 'CB', Name: '', SelectedItem: 0, Items: [] }]
                    }, ...platillo.Variants.slice(index + 1)]
            };
            return newPlatillo;
        });
    };

    const removeVariantIngrediente = (indexVariant, indexIngrediente) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: [
                ...platillo.Variants.slice(0, indexVariant), {
                    ...platillo.Variants[indexVariant], Ingredientes: [
                        ...platillo.Variants[indexVariant].Ingredientes.slice(0, indexIngrediente),
                        ...platillo.Variants[indexVariant].Ingredientes.slice(indexIngrediente + 1)]
                },
                ...platillo.Variants.slice(indexVariant + 1)]
            };
            return newPlatillo;
        });
    };

    const handleVariantIngrediente = (indexVariant, indexIngrediente, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === indexVariant) {
                const newIngredientes = variant.Ingredientes.map((ingrediente, idx) => {
                    if (idx === indexIngrediente) {
                        return { ...ingrediente, [event.target.id]: event.target.value };
                    }
                    return ingrediente;
                });
                return { ...variant, Ingredientes: newIngredientes };
            }
            return variant;
        });
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: newVariants }
            return newPlatillo;
        });
    }

    const addVariantIngredienteItem = (indexVariant, indexIngrediente) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = {
                ...platillo, Variants: [
                    ...platillo.Variants.slice(0, indexVariant), {
                        ...platillo.Variants[indexVariant], Ingredientes: [
                            ...platillo.Variants[indexVariant].Ingredientes.slice(0, indexIngrediente), {
                                ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente], Items: [
                                        ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items, {Checked: false, Name: '', SelectedCantidad: 0, ItemCantidad: []} ]
                            }, ...platillo.Variants[indexVariant].Ingredientes.slice(indexIngrediente + 1)]
                    }, ...platillo.Variants.slice(indexVariant + 1)]
            };
            return newPlatillo;
        });
    };

    const removeVariantIngredienteItem = (indexVariant, indexIngrediente, indexItem) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: [
                        ...platillo.Variants.slice(0, indexVariant), {
                            ...platillo.Variants[indexVariant], Ingredientes: [
                                ...platillo.Variants[indexVariant].Ingredientes.slice(0, indexIngrediente), {
                                    ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente], Items: [
                                            ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(0, indexItem),
                                            ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(indexItem + 1)]
                                }, ...platillo.Variants[indexVariant].Ingredientes.slice(indexIngrediente + 1)]
                        }, ...platillo.Variants.slice(indexVariant + 1)]
                };
                return newPlatillo;
            });
    };

    const handleVariantIngredienteItem = (indexVariant, indexIngrediente, indexItem, event) => {
        // ingredientes has an array called Items, for this case we will update ingrediente.Items[indexItem] con el valor event.taget.value
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newIngredientes = variant.Ingredientes.map((ingrediente, idx) => {
                        if (idx === indexIngrediente) {
                            const newItems = ingrediente.Items.map((item, idx) => {
                                if (idx === indexItem) {
                                    return { ...item, [event.target.id]: event.target.value };
                                }
                                return item;
                            });
                            return { ...ingrediente, Items: newItems };
                        }
                        return ingrediente;
                    });
                    return { ...variant, Ingredientes: newIngredientes };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const addVariantIngredienteItemCantidad = (indexVariant, indexIngrediente, indexItem) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = {
                ...platillo, Variants: [
                    ...platillo.Variants.slice(0, indexVariant), {
                        ...platillo.Variants[indexVariant], Ingredientes: [
                            ...platillo.Variants[indexVariant].Ingredientes.slice(0, indexIngrediente), {
                                ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente], Items: [
                                    ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(0, indexItem), {
                                        ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem], ItemCantidad: [
                                            ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].ItemCantidad, { Name: '' } ]
                                    }, ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(indexItem + 1)]
                            }, ...platillo.Variants[indexVariant].Ingredientes.slice(indexIngrediente + 1)]
                    }, ...platillo.Variants.slice(indexVariant + 1)]
            };
            return newPlatillo;
        });
    };

    const removeVariantIngredienteItemCantidad = (indexVariant, indexIngrediente, indexItem, indexItemCantidad) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: [
                    ...platillo.Variants.slice(0, indexVariant), {
                        ...platillo.Variants[indexVariant], Ingredientes: [
                            ...platillo.Variants[indexVariant].Ingredientes.slice(0, indexIngrediente), {
                                ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente], Items: [
                                    ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(0, indexItem), {
                                        ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem], ItemCantidad: [
                                            ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].ItemCantidad.slice(0, indexItemCantidad),
                                            ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].ItemCantidad.slice(indexItemCantidad + 1)]
                                    }, ...platillo.Variants[indexVariant].Ingredientes[indexIngrediente].Items.slice(indexItem + 1)]
                            }, ...platillo.Variants[indexVariant].Ingredientes.slice(indexIngrediente + 1)]
                    },...platillo.Variants.slice(indexVariant + 1)]
                };
                return newPlatillo;
            });
    };

    const handleVariantIngredienteItemCantidad = (indexVariant, indexIngrediente, indexItem, indexCantidad, event) => {
        // ingredientes has an array called Cantidad, for this case we will update ingrediente.Cantidad[indexCantidad] con el valor event.taget.value
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newIngredientes = variant.Ingredientes.map((ingrediente, idx) => {
                        if (idx === indexIngrediente) {
                            const newItems = ingrediente.Items.map((item, idx) => {
                                if (idx === indexItem) {
                                    const newItemCantidad = item.ItemCantidad.map((cantidad, idex) =>  {
                                        if (idx === indexCantidad) {
                                            return { ...cantidad, [event.target.id]: event.target.value };
                                        }
                                        return cantidad;
                                    });
                                    return { ...item, ItemCantidad: newItemCantidad};
                                }
                                return item;
                            });
                            return { ...ingrediente, Items: newItems };
                        }
                        return ingrediente;
                    });
                    return { ...variant, Ingredientes: newIngredientes };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const addVariantExtra = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [...platillo.Variants.slice(0, index), { ...platillo.Variants[index], Extras: [...platillo.Variants[index].Extras, { Checked: false, Extra: '', SelectedOpcion: 0,Opciones: [''], SelectedCantidad: 0,Cantidad: [''], Precio: 0 }] }, ...platillo.Variants.slice(index + 1)]}
            return newPlatillo;
        });
    };

    const removeVariantExtra = (indexVariant, indexExtra) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Extras: [...platillo.Variants[indexVariant].Extras.slice(0, indexExtra), ...platillo.Variants[indexVariant].Extras.slice(indexExtra + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
            return newPlatillo;
        });
    };

    const handleVariantExtra = (indexVariant, indexExtra, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newExtras = variant.Extras.map((extra, idx) => {
                        if (idx === indexExtra) {
                            return { ...extra, [event.target.id]: event.target.value };
                        }
                        return extra;
                    });
                    return { ...variant, Extras: newExtras };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const addVariantExtraOpcion = (indexVariant, indexExtra) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Extras: [...platillo.Variants[indexVariant].Extras.slice(0, indexExtra), { ...platillo.Variants[indexVariant].Extras[indexExtra], Opciones: [...platillo.Variants[indexVariant].Extras[indexExtra].Opciones, ''] }, ...platillo.Variants[indexVariant].Extras.slice(indexExtra + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const handleVariantExtraOpcion = (indexVariant, indexExtra, indexOpcion, event) => {
        // extras has an array called Opciones, for this case we will update extra.Opcion[indexOpcion] con el valor event.taget.value
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === indexVariant) {
                const newExtras = variant.Extras.map((extra, idx) => {
                    if (idx === indexExtra) {
                        const newOpciones = extra.Opciones.map((opcion, idx) => {
                            if (idx === indexOpcion) {
                                return event.target.value;
                            }
                            return opcion;
                        });
                        return { ...extra, Opciones: newOpciones };
                    }
                    return extra;
                    });
                    return { ...variant, Extras: newExtras };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const removeVariantExtraOpcion = (indexVariant, indexExtra, indexOpcion) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Extras: [...platillo.Variants[indexVariant].Extras.slice(0, indexExtra), { ...platillo.Variants[indexVariant].Extras[indexExtra], Opciones: [...platillo.Variants[indexVariant].Extras[indexExtra].Opciones.slice(0, indexOpcion), ...platillo.Variants[indexVariant].Extras[indexExtra].Opciones.slice(indexOpcion + 1)] }, ...platillo.Variants[indexVariant].Extras.slice(indexExtra + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const addVariantExtraCantidad = (indexVariant, indexExtra) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Extras: [...platillo.Variants[indexVariant].Extras.slice(0, indexExtra), { ...platillo.Variants[indexVariant].Extras[indexExtra], Cantidad: [...platillo.Variants[indexVariant].Extras[indexExtra].Cantidad, ''] }, ...platillo.Variants[indexVariant].Extras.slice(indexExtra + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const handleVariantExtraCantidad = (indexVariant, indexExtra, indexCantidad, event) => {
        // extras has an array called Cantidad, for this case we will update extra.Cantidad[indexCantidad] con el valor event.taget.value
        const newVariants = platillo.Variants.map((variant, idx) => {
            if (idx === indexVariant) {
                const newExtras = variant.Extras.map((extra, idx) => {
                    if (idx === indexExtra) {
                        const newCantidad = extra.Cantidad.map((cantidad, idx) => {
                            if (idx === indexCantidad) {
                                return event.target.value;
                            }
                            return cantidad;
                        });
                        return { ...extra, Cantidad: newCantidad };
                    }
                    return extra;
                });
                return { ...variant, Extras: newExtras };
            }
            return variant;
        });
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo, Variants: newVariants }
            return newPlatillo;
        });
    };

    const removeVariantExtraCantidad = (indexVariant, indexExtra, indexCantidad) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Extras: [...platillo.Variants[indexVariant].Extras.slice(0, indexExtra), { ...platillo.Variants[indexVariant].Extras[indexExtra], Cantidad: [...platillo.Variants[indexVariant].Extras[indexExtra].Cantidad.slice(0, indexCantidad), ...platillo.Variants[indexVariant].Extras[indexExtra].Cantidad.slice(indexCantidad + 1)] }, ...platillo.Variants[indexVariant].Extras.slice(indexExtra + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const addVariantAdicional = (index) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [...platillo.Variants.slice(0, index), { ...platillo.Variants[index], Adicionales: [...platillo.Variants[index].Adicionales, { Checked: false, Adicional: '', SelectedOpcion: 0, Opciones: [''], SelectedCantidad: 0, Cantidad: [''], Precio: 0 }] }, ...platillo.Variants.slice(index + 1)]}
            return newPlatillo;
        });
    };

    const removeVariantAdicional = (indexVariant, indexAdicional) => {
        setPlatillo(prevPlatillo => {
            const newPlatillo = { ...platillo,
                Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Adicionales: [...platillo.Variants[indexVariant].Adicionales.slice(0, indexAdicional), ...platillo.Variants[indexVariant].Adicionales.slice(indexAdicional + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
            return newPlatillo;
        });
    };

    const handleVariantAdicional = (indexVariant, indexAdicional, event) => {
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newAdicionales = variant.Adicionales.map((adicional, idx) => {
                        if (idx === indexAdicional) {
                            return { ...adicional, [event.target.id]: event.target.value };
                        }
                        return adicional;
                    });
                    return { ...variant, Adicionales: newAdicionales };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const addVariantAdicionalOpcion = (indexVariant, indexAdicional) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Adicionales: [...platillo.Variants[indexVariant].Adicionales.slice(0, indexAdicional), { ...platillo.Variants[indexVariant].Adicionales[indexAdicional], Opciones: [...platillo.Variants[indexVariant].Adicionales[indexAdicional].Opciones, ''] }, ...platillo.Variants[indexVariant].Adicionales.slice(indexAdicional + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const handleVariantAdicionalOpcion = (indexVariant, indexAdicional, indexOpcion, event) => {
        // adicionales has an array called Opciones, for this case we will update adicional.Opcion[indexOpcion] con el valor event.target.value
        const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newAdicionales = variant.Adicionales.map((adicional, idx) => {
                        if (idx === indexAdicional) {
                            const newOpciones = adicional.Opciones.map((opcion, idx) => {
                                if (idx === indexOpcion) {
                                    return event.target.value;
                                }
                                return opcion;
                            });
                            return { ...adicional, Opciones: newOpciones };
                        }
                        return adicional;
                    });
                    return { ...variant, Adicionales: newAdicionales };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const removeVariantAdicionalOpcion = (indexVariant, indexAdicional, indexOpcion) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Adicionales: [...platillo.Variants[indexVariant].Adicionales.slice(0, indexAdicional), { ...platillo.Variants[indexVariant].Adicionales[indexAdicional], Opciones: [...platillo.Variants[indexVariant].Adicionales[indexAdicional].Opciones.slice(0, indexOpcion), ...platillo.Variants[indexVariant].Adicionales[indexAdicional].Opciones.slice(indexOpcion + 1)] }, ...platillo.Variants[indexVariant].Adicionales.slice(indexAdicional + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };
    
    const addVariantAdicionalCantidad = (indexVariant, indexAdicional) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Adicionales: [...platillo.Variants[indexVariant].Adicionales.slice(0, indexAdicional), { ...platillo.Variants[indexVariant].Adicionales[indexAdicional], Cantidad: [...platillo.Variants[indexVariant].Adicionales[indexAdicional].Cantidad, ''] }, ...platillo.Variants[indexVariant].Adicionales.slice(indexAdicional + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const handleVariantAdicionalCantidad = (indexVariant, indexAdicional, indexCantidad, event) => {
        // adicionales has an array called Cantidad, for this case we will update adicional.Cantidad[indexCantidad] con el valor event.target.value
            const newVariants = platillo.Variants.map((variant, idx) => {
                if (idx === indexVariant) {
                    const newAdicionales = variant.Adicionales.map((adicional, idx) => {
                        if (idx === indexAdicional) {
                            const newCantidad = adicional.Cantidad.map((cantidad, idx) => {
                                if (idx === indexCantidad) {
                                    return event.target.value;
                                }
                                return cantidad;
                            });
                            return { ...adicional, Cantidad: newCantidad };
                        }
                        return adicional;
                    });
                    return { ...variant, Adicionales: newAdicionales };
                }
                return variant;
            });
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo, Variants: newVariants }
                return newPlatillo;
            });
    };

    const removeVariantAdicionalCantidad = (indexVariant, indexAdicional, indexCantidad) => {
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant), { ...platillo.Variants[indexVariant], Adicionales: [...platillo.Variants[indexVariant].Adicionales.slice(0, indexAdicional), { ...platillo.Variants[indexVariant].Adicionales[indexAdicional], Cantidad: [...platillo.Variants[indexVariant].Adicionales[indexAdicional].Cantidad.slice(0, indexCantidad), ...platillo.Variants[indexVariant].Adicionales[indexAdicional].Cantidad.slice(indexCantidad + 1)] }, ...platillo.Variants[indexVariant].Adicionales.slice(indexAdicional + 1)] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const duplicateVariant = (indexVariant) => {
        // take Variant[indexVariant] and create a new Variant with the same content
        setPlatillo(prevPlatillo => {
                const newPlatillo = { ...platillo,
                    Variants: [...platillo.Variants.slice(0, indexVariant + 1), { ...platillo.Variants[indexVariant] }, ...platillo.Variants.slice(indexVariant + 1)]}
                return newPlatillo;
            });
    };

    const handleSubmitSuccess = (message) => {
        alert(message);
        onSaved?.();
        if (onClose) {
            onClose();
            return;
        }
        fetchResetPlatillo();
        fetchPlatillos();
        handleToggleButtonAction();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (buttonAction === "Agregar") {
            platillosApi.addPlatillo(platillo)
            .then(() => handleSubmitSuccess("Platillo agregado correctamente"))
        } else if (buttonAction === "Actualizar") {
            platillosApi.updatePlatillo(platillo)
            .then(() => handleSubmitSuccess("Platillo actualizado correctamente"))
        }
    };

    const handleCancelPlatillo = () => {
        fetchResetPlatillo();
        fetchPlatillos();
        handleToggleButtonAction();
        fetchPlatilloId();
        // Cerrar modal si existe la función onClose
        if (onClose) onClose();
    }

    const handleJsonDraftChange = (e) => {
        const newValue = e.target.value;
        setJsonDraft(newValue);
        setJsonIsDirty(newValue !== platilloJson);
        setJsonError('');
    };

    const handleJsonScroll = (e) => {
        if (jsonLineNumbersRef.current) {
            jsonLineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleApplyJsonToForm = () => {
        try {
            const parsedValue = JSON.parse(jsonDraft);
            const normalizedPlatillo = normalizePlatillo(parsedValue);

            setPlatillo(normalizedPlatillo);
            setJsonDraft(JSON.stringify(normalizedPlatillo, null, 2));
            setJsonIsDirty(false);
            setJsonError('');
        } catch (error) {
            setJsonError(error.message || 'No se pudo interpretar el JSON.');
        }
    };

    const containerRef = useRef(null);
    const [numVariantsPerRow, setNumVariantsPerRow] = useState (1);
    const updateNumVariantsPerRow = (width) => {
        // console.log(`Width: ${width}`)
        const variantWidth = 900;
        // console.log(`checkBoxWidth: ${variantWidth}`)
        const newNumVariantsPerRow = Math.floor(width / variantWidth);
        setNumVariantsPerRow(prevNumCheckBoxPerRow => {
            // console.log(`Productos por fila: ${newNumVariantsPerRow > 0 ? newNumVariantsPerRow : 1}`)
            return newNumVariantsPerRow > 0 ? newNumVariantsPerRow : 1;
        });
    };

    const [numColsForPlatilloFormPart1, setNumColsForPlatilloFormPart1] = useState (12);
    const updateNumColsForPlatilloFormPart1 = (width) => {
        // console.log(`Width: ${width}`)
        const variantWidth = 900;
        // console.log(`checkBoxWidth: ${variantWidth}`)
        const newNumColsForPlatilloFormPart1 = Math.floor(variantWidth / width * 12);
        setNumColsForPlatilloFormPart1(prevNumColsForPlatilloFormPart1 => {
            // console.log(`Columnas por PlatilloForm: ${newNumColsForPlatilloFormPart1 > 0 ? newNumColsForPlatilloFormPart1 : 1}`)
            return newNumColsForPlatilloFormPart1 < 12 ? newNumColsForPlatilloFormPart1 : 12;
        });
    };

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                updateNumVariantsPerRow(width);
                updateNumColsForPlatilloFormPart1(width);
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    return (
        <div className="row" ref={containerRef}><div className="col-12">
            {/* Grid de Platillos agrupados por Categoría */}
            {showList && (
            <div className="platillos-container">
                <h2 className="platillos-titulo">Lista de Platillos</h2>
                {/* Botón para agregar nuevo platillo cuando está en modo lista */}
                {mode === "list" && (
                    <div className="add-platillo-btn-container">
                        <button type="button" className="btn btn-success btn-lg add-new-platillo-btn" onClick={() => onEditRequest && onEditRequest(null, '')}>
                            ➕ Agregar Nuevo Platillo
                        </button>
                    </div>
                )}
                {categoriasPlatillos.map((categoria) => (
                    <div
                        key={categoria}
                        className={`platillo-categoria-grupo${collapsedCategorias.has(categoria) ? ' is-collapsed' : ''}`}
                    >
                        <button
                            type="button"
                            className="platillo-categoria-header platillo-categoria-header--toggle"
                            onClick={() => toggleCategoriaCollapsed(categoria)}
                            aria-expanded={!collapsedCategorias.has(categoria)}
                        >
                            <h4 className="platillo-categoria-titulo">{categoria}</h4>
                            <span className="platillo-categoria-contador">
                                {platillosAgrupados[categoria].length} platillo{platillosAgrupados[categoria].length !== 1 ? 's' : ''}
                                <span className="platillo-categoria-chevron" aria-hidden="true">▾</span>
                            </span>
                        </button>
                        <div className="platillo-categoria-body">
                        <div className="row platillos-grid">
                            {createPlatillosWithButtons(platillosAgrupados[categoria]).map((item, index) => {
                                if (item.type === 'platillo') {
                                    return (
                                        <div key={item.data.PlatilloId} className="col-12 col-sm-6 col-md-4 col-lg-2 platillo-card-wrapper">
                                            <div className="platillo-card">
                                                <div className="platillo-card-header">
                                                    <div className="platillo-id-controls">
                                                        <button
                                                            type="button"
                                                            className="platillo-id-move-btn"
                                                            title="Mover al ID disponible anterior"
                                                            disabled={
                                                                movingPlatilloId === Number(item.data.PlatilloId)
                                                                || getNextAvailablePlatilloId(item.data.PlatilloId, 'backward') == null
                                                            }
                                                            onClick={() => handleMovePlatilloId(item.data, 'backward')}
                                                        >
                                                            ←
                                                        </button>
                                                        <span className="platillo-id">#{item.data.PlatilloId}</span>
                                                        <button
                                                            type="button"
                                                            className="platillo-id-move-btn"
                                                            title="Mover al siguiente ID disponible"
                                                            disabled={movingPlatilloId === Number(item.data.PlatilloId)}
                                                            onClick={() => handleMovePlatilloId(item.data, 'forward')}
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                    <span
                                                        className={`platillo-disponibilidad platillo-disponibilidad--toggle ${getDisponibilidadClass(item.data.Disponibilidad)}`}
                                                        title="Doble clic: 0 ↔ -1 (si hay stock, pasa a 0)"
                                                        onDoubleClick={() => handleDisponibilidadDoubleClick(item.data)}
                                                    >
                                                        Disp: {Number(item.data.Disponibilidad)}
                                                    </span>
                                                </div>
                                                <div className="platillo-card-body">
                                                    {item.data.Imagen && (
                                                        <div className="platillo-card-thumb">
                                                            <img src={item.data.Imagen} alt={item.data.NombrePlatillo || 'Platillo'} />
                                                        </div>
                                                    )}
                                                    <div className="platillo-card-text">
                                                        <h5 className="platillo-nombre">{item.data.NombrePlatillo}</h5>
                                                        <p className="platillo-descripcion">{item.data.Descripcion || 'Sin descripción'}</p>
                                                    </div>
                                                </div>
                                                <div className="platillo-card-footer">
                                                    <button type="button" className="btn btn-warning btn-sm" onClick={() => handleEditPlatillo(item.data.PlatilloId, item.data.Categoria)}>
                                                        Editar
                                                    </button>
                                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeletePlatillo(item.data.PlatilloId)}>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else if (item.type === 'button') {
                                    return (
                                        <div key={`missing-${item.id}`} className="col-12 col-sm-6 col-md-4 col-lg-2 platillo-card-wrapper">
                                            <div className="platillo-missing-button-container">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-primary platillo-missing-button"
                                                    onClick={() => handleEditPlatillo(item.id, categoria)}
                                                >
                                                    #{item.id}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
            {showForm && (
            <div className="row form-json-layout">
                <div className="col-12 col-xl-8">
                <form className="FormAddPlatillo" onSubmit={handleSubmit}>
                    <div className="row"><div className={`col-${numColsForPlatilloFormPart1}`}>
                        <div  style={{backgroundColor: "#42fae0", padding: "10px", borderRadius: "10px"}}>
                            <div className="form-group">
                                <label htmlFor="PlatilloId">Platillo Id</label>
                                <input type="text" className="form-control" id="PlatilloId" placeholder="Platillo Id"
                                value={platillo.PlatilloId} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Categoria">Categoría</label>
                                <input type="text" className="form-control" id="Categoria" placeholder="Categoría"
                                value={platillo.Categoria} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="NombrePlatillo">Nombre del Platillo</label>
                                <input type="text" className="form-control" id="NombrePlatillo" placeholder="Nombre del Platillo"
                                value={platillo.NombrePlatillo} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Descripcion">Descripción</label>
                                <input type="text" className="form-control" id="Descripcion" placeholder="Descripción"
                                value={platillo.Descripcion} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Imagen">Imágen</label>
                                <input type="text" className="form-control" id="Imagen" placeholder="icons/icon.png"
                                value={platillo.Imagen} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Disponibilidad">Disponibilidad</label>
                                <input type="number" className="form-control" id="Disponibilidad" placeholder="0"
                                value={platillo.Disponibilidad} onChange={handleInputChange} />
                            </div>
                            {/* Add Variant at Level 1 */}
                            <div className="form-group">
                                <button type="button" className="btn btn-primary" onClick={addVariant}>Agregar Variante</button>
                            </div>
                        </div>
                    </div></div>
                    <div className="row">
                    {/* Generate Variant Map at Level 1 */}
                    {platillo.Variants.map((variant, indexVariant) => (
                        <div className={`col-${12/numVariantsPerRow}`} key={indexVariant}>
                            <div style={{backgroundColor: "#ff69b4", padding: "25px", margin: "5px", borderRadius: "10px", fontWeight: "bold", color: "white", fontSize: "18px"}}>
                                <div className="row">
                                    <div className="col-6 form-group">
                                        <label htmlFor="VariantName">Nombre de Variante</label>
                                        <input type="text" className="form-control" id="VariantName" placeholder="Nombre de Variante"
                                        value={variant.VariantName} onChange={(e) => handleVariantChange(indexVariant, e)} />
                                    </div>
                                    <div className="col-4 form-group">
                                        <label htmlFor="Precio">Precio</label>
                                        <input type="number" className="form-control" id="Precio" placeholder="Precio"
                                        value={variant.Precio} onChange={(e) => handleVariantChange(indexVariant, e)} />
                                    </div>
                                    <div className="col-2 form-group button_container">
                                        <button type="button" className="btn btn-danger" onClick={() => removeVariant(indexVariant)}>Eliminar</button>
                                    </div>
                                </div>
                                {/* Generate Componente at Level 2 inside of Variant */}
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group">
                                        <button type="button" className="btn btn-primary" onClick={() => addVariantComponente(indexVariant)}>Agregar Componentes</button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group" style={{backgroundColor: "#e44f9c", padding: "10px", borderRadius: "10px"}}>
                                        {variant.Componentes.map((componente, indexComponente) => (
                                            <div key={indexComponente}>
                                                { indexComponente > 0 && (<hr />)}
                                                <div className="row">
                                                    <div className="col-4"><label className="componenteLabel" htmlFor="Name">Componente {indexComponente}:</label></div>
                                                    <div className="col-6"><input type="text" className="form-control" id="Name" placeholder="Nombre Componente"
                                                    value={componente.Name} onChange={(e) => handleVariantComponente(indexVariant, indexComponente, e)} /></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeVariantComponente(indexVariant, indexComponente)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-4"><label className="componenteLabel" htmlFor="Precio">Precio</label></div>
                                                    <div className="col-6"><input type="text" className="form-control" id="Precio" placeholder="Precio"
                                                    value={componente.Precio} onChange={(e) => handleVariantComponente(indexVariant, indexComponente, e)} /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Generate Option at Level 2 inside of Variant */}
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group">
                                        <button type="button" className="btn btn-primary" onClick={() => addVariantOpcion(indexVariant)}>Agregar Opción</button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group" style={{backgroundColor: "#e44f9c", padding: "10px", borderRadius: "10px"}}>
                                        {variant.Opciones.map((opcion, indexOption) => (
                                            <div key={indexOption}>
                                            {indexOption > 0 && (<hr />)}
                                                <div className="row">
                                                    <div className="col-3"><label htmlFor="Name">Nombre Selector</label></div>
                                                    <div className="col-7"><input type="text" className="form-control" id="Name" placeholder="Nombre Selector"
                                                    value={opcion.Name} onChange={(e) => handleVariantOpcion(indexVariant, indexOption, e)} /></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger" onClick={() => removeVariantOpcion(indexVariant, indexOption)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                {/* Add Item at Level 3 inside of Options */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11">
                                                        <div className="form-group btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVarianOptionItem(indexVariant, indexOption)}>Agregar Item</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {opcion.Items.map((item, indexItem) => (
                                                <div className="row">
                                                        <div className="col-1"></div>
                                                        <div className="col-1 itemContainer"><label className="itemLabel" htmlFor="Name">Item</label></div>
                                                        <div className="col-4 itemInputContainer"><input type="text" className="form-control" id="Name" placeholder="Item"
                                                        value={item.Name} onChange={(e) => handleVariantOptionItem(indexVariant, indexOption, indexItem, e)} /></div>
                                                        <div className="col-1 itemContainer"><label className="itemLabel" htmlFor="Precio">Precio</label></div>
                                                        <div className="col-3 itemInputContainerPrecio"><input type="text" className="form-control" id="Precio" placeholder="Precio"
                                                        value={item.Precio} onChange={(e) => handleVariantOptionItem(indexVariant, indexOption, indexItem, e)} /></div>
                                                        <div className="col-2 btn-sm-cont">
                                                            <button type="button" className="btn btn-danger" onClick={() => removeVariantOptionItem(indexVariant, indexOption, indexItem)}>Eliminar</button>
                                                        </div>
                                                </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Generate Ingredientes at Level 2 inside of Variant */}
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group">
                                        <button type="button" className="btn btn-primary" onClick={() => addVariantIngrediente(indexVariant)}>Agregar Ingrediente CheckBox</button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group" style={{backgroundColor: "#ff97d9", padding: "10px", borderRadius: "10px"}}>
                                        {variant.Ingredientes.map((ingrediente, indexIngrediente) => (
                                            <div key={indexIngrediente}>
                                            {indexIngrediente > 0 && (<hr />)}
                                                <div className="row">
                                                    <div className="col-12 form-group"><div className="row">
                                                        <div className="col-3"><label htmlFor="Name">Ingrediente</label></div>
                                                        <div className="col-7"><input type="text" className="form-control" id="Name" placeholder="Nombre"
                                                        value={ingrediente.Name} onChange={(e) => handleVariantIngrediente(indexVariant, indexIngrediente, e)} /></div>
                                                        <div className="col-2 btn-sm-cont">
                                                            <button type="button" className="btn btn-danger" onClick={() => removeVariantIngrediente(indexVariant, indexIngrediente)}>Eliminar</button>
                                                        </div>
                                                    </div></div>
                                                </div>
                                                {/* Add Item at Level 3 inside of Ingrediente */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11 btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVariantIngredienteItem(indexVariant, indexIngrediente)}>Agregar Item</button>
                                                    </div>
                                                </div>
                                                {ingrediente.Items.map((item, indexItem) => (
                                                    <div key={indexItem}>
                                                        <div className="row">
                                                            <div className="col-1"></div>
                                                            <div className="col-2"><label htmlFor="Name" className="itemLabel">Item</label></div>
                                                            <div className="col-4"><input type="text" className="form-control" id="Name" placeholder="Nombre"
                                                            value={item.Name} onChange={(e) => handleVariantIngredienteItem(indexVariant, indexIngrediente, indexItem, e)} /></div>
                                                            <div className="col-2 btn-sm-cont">
                                                                <button type="button" className="btn btn-danger" onClick={() => removeVariantIngredienteItem(indexVariant, indexIngrediente, indexItem)}>Eliminar</button>
                                                            </div>
                                                            {/* Add Cantidad at Level 3 inside of Ingredientes Opcion */}
                                                            <div className="col-3 btn-sm-cont">
                                                                <button type="button" className="btn btn-primary" onClick={() => addVariantIngredienteItemCantidad(indexVariant, indexIngrediente, indexItem)}>Agregar Cantidad</button>
                                                            </div>
                                                        </div>
                                                        {item.ItemCantidad.length > 0 && (<hr />)}
                                                        {item.ItemCantidad.map((cantidad, indexCantidad) => (
                                                            <div className="row">
                                                                <div className="col-2"></div>
                                                                <div className="col-2"><label htmlFor="Name" className="cantidadLabel">Cantidad</label></div>
                                                                <div className="col-4"><input type="text" className="form-control" id="Name" placeholder="Nombre"
                                                                value={cantidad.Name} onChange={(e) => handleVariantIngredienteItemCantidad(indexVariant, indexIngrediente, indexItem, indexCantidad, e)} /></div>
                                                                <div className="col-2 btn-sm-cont">
                                                                    <button type="button" className="btn btn-danger" onClick={() => removeVariantIngredienteItemCantidad(indexVariant, indexIngrediente, indexItem, indexCantidad)}>Eliminar</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Generate Extra at level 2 inside of Variant */}
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group">
                                        <button type="button" className="btn btn-primary" onClick={() => addVariantExtra(indexVariant)}>Agregar Extra</button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group" style={{backgroundColor: "#e44f9c", padding: "10px", borderRadius: "10px"}}>
                                        {variant.Extras.map((extra, indexExtra) => (
                                            <div key={indexExtra}>
                                            <hr />
                                                <div className="row">
                                                    <div className="col-12 form-group"><div className="row">
                                                        <div className="col-3"><label htmlFor="Extra">Extra</label></div>
                                                        <div className="col-7"><input type="text" className="form-control" id="Extra" placeholder="Extra"
                                                        value={extra.Extra} onChange={(e) => handleVariantExtra(indexVariant, indexExtra, e)} /></div>
                                                    </div></div>
                                                    <div className="col-12 form-group"><div className="row">
                                                        <div className="col-3"><label htmlFor="Precio">Precio</label></div>
                                                        <div className="col-7"><input type="number" className="form-control" id="Precio" placeholder="Precio"
                                                        value={extra.Precio} onChange={(e) => handleVariantExtra(indexVariant, indexExtra, e)} /></div>
                                                        <div className="col-2 btn-sm-cont">
                                                            <button type="button" className="btn btn-danger" onClick={() => removeVariantExtra(indexVariant, indexExtra)}>Eliminar</button>
                                                        </div>
                                                    </div></div>
                                                </div>
                                                {/* Add Opcion at Level 3 inside of Extras Opcion */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11">
                                                        <div className="form-group btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVariantExtraOpcion(indexVariant, indexExtra)}>Agregar Opción</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {extra.Opciones.map((opcion, indexOpcion) => (
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-2 subTitle2"><label htmlFor="Opcion">Opcion</label></div>
                                                    <div className="col-6"><input type="text" className="form-control" id="Opcion" placeholder="Opción"
                                                    value={opcion} onChange={(e) => handleVariantExtraOpcion(indexVariant, indexExtra, indexOpcion, e)}></input></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger" onClick={() => removeVariantExtraOpcion(indexVariant, indexExtra, indexOpcion)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                ))}
                                                {/* Add Cantidad at Level 3 inside of Extras Opcion */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11">
                                                        <div className="form-group btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVariantExtraCantidad(indexVariant, indexExtra)}>Agregar Cantidad</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {extra.Cantidad.map((cantidad, indexCantidad) => (
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-2 subTitle2"><label htmlFor="Cantidad">Cantidad</label></div>
                                                    <div className="col-6"><input type="text" className="form-control" id="Cantidad" placeholder="Cantidad"
                                                    value={cantidad} onChange={(e) => handleVariantExtraCantidad(indexVariant, indexExtra, indexCantidad, e)}></input></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger" onClick={() => removeVariantExtraCantidad(indexVariant, indexExtra, indexCantidad)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Generate Adicional at level 2 inside of Variant */}
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group">
                                        <button type="button" className="btn btn-primary" onClick={() => addVariantAdicional(indexVariant)}>Agregar Adicional</button>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-1"></div>
                                    <div className="col-11 form-group" style={{backgroundColor: "#ff97d9", padding: "10px", borderRadius: "10px"}}>
                                        {variant.Adicionales.map((adicional, indexAdicional) => (
                                            <div key={indexAdicional}>
                                            <hr />
                                                <div className="row">
                                                    <div className="col-12 form-group"><div className="row">
                                                        <div className="col-3"><label htmlFor="Adicional">Adicional</label></div>
                                                        <div className="col-7"><input type="text" className="form-control" id="Adicional" placeholder="Adicional"
                                                        value={adicional.Adicional} onChange={(e) => handleVariantAdicional(indexVariant, indexAdicional, e)} /></div>
                                                    </div></div>
                                                    <div className="col-12 form-group"><div className="row">
                                                        <div className="col-3"><label htmlFor="Precio">Precio</label></div>
                                                        <div className="col-7"><input type="number" className="form-control" id="Precio" placeholder="Precio"
                                                        value={adicional.Precio} onChange={(e) => handleVariantAdicional(indexVariant, indexAdicional, e)} /></div>
                                                        <div className="col-2 btn-sm-cont">
                                                            <button type="button" className="btn btn-danger" onClick={() => removeVariantAdicional(indexVariant, indexAdicional)}>Eliminar</button>
                                                        </div>
                                                    </div></div>
                                                </div>
                                                {/* Add Opcion at Level 3 inside of Adicionales Opcion */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11">
                                                        <div className="form-group btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVariantAdicionalOpcion(indexVariant, indexAdicional)}>Agregar Opción</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {adicional.Opciones.map((opcion, indexOpcion) => (
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-2 subTitle2"><label htmlFor="Opcion">Opcion</label></div>
                                                    <div className="col-4"><input type="text" className="form-control" id="Opcion" placeholder="Opción"
                                                    value={opcion} onChange={(e) => handleVariantAdicionalOpcion(indexVariant, indexAdicional, indexOpcion, e)}></input></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger" onClick={() => removeVariantAdicionalOpcion(indexVariant, indexAdicional, indexOpcion)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                ))}
                                                {/* Add Cantidad at Level 3 inside of Adicionales Opcion */}
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-11">
                                                        <div className="form-group btn-sm-cont">
                                                            <button type="button" className="btn btn-primary" onClick={() => addVariantAdicionalCantidad(indexVariant, indexAdicional)}>Agregar Cantidad</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {adicional.Cantidad.map((cantidad, indexCantidad) => (
                                                <div className="row">
                                                    <div className="col-1"></div>
                                                    <div className="col-2 subTitle2"><label htmlFor="Cantidad">Cantidad</label></div>
                                                    <div className="col-4"><input type="text" className="form-control" id="Cantidad" placeholder="Cantidad"
                                                    value={cantidad} onChange={(e) => handleVariantAdicionalCantidad(indexVariant, indexAdicional, indexCantidad, e)}></input></div>
                                                    <div className="col-2 btn-sm-cont">
                                                        <button type="button" className="btn btn-danger" onClick={() => removeVariantAdicionalCantidad(indexVariant, indexAdicional, indexCantidad)}>Eliminar</button>
                                                    </div>
                                                </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-4">
                                        <button type="button" className="btn btn-warning" onClick={() => duplicateVariant(indexVariant)}>Duplicar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    <div className="form-group">
                        <button type="submit" className="btn btn-success" >{buttonAction}</button>
                        <button type="button" className="btn btn-danger" onClick={handleCancelPlatillo}>Cancelar</button>
                    </div>

                </form>
                </div>
                <div className="col-12 col-xl-4">
                    <div className="json-editor-panel">
                        <div className="json-editor-header">
                            <div>
                                <h4 className="json-editor-title">JSON en tiempo real</h4>
                                <p className="json-editor-subtitle">Edita el formulario o el JSON y sincroniza cuando quieras.</p>
                            </div>
                            {jsonIsDirty && (
                                <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyJsonToForm}>
                                    Actualizar formulario
                                </button>
                            )}
                        </div>
                        <div className="json-editor-body">
                            <pre className="json-editor-lines" ref={jsonLineNumbersRef}>{jsonLineNumbers}</pre>
                            <textarea
                                className="json-editor-textarea"
                                value={jsonDraft}
                                onChange={handleJsonDraftChange}
                                onScroll={handleJsonScroll}
                                spellCheck={false}
                                wrap="off"
                            />
                        </div>
                        <div className="json-editor-footer">
                            {jsonError ? (
                                <span className="json-editor-error">JSON invalido: {jsonError}</span>
                            ) : (
                                <span className="json-editor-status">
                                    {jsonIsDirty ? 'Hay cambios manuales pendientes por aplicar.' : 'El JSON refleja el formulario actual.'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div></div>
    );
};

export default AddPlatilloForm;

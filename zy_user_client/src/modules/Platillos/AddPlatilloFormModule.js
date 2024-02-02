import './AddPlatilloForm.css'
import checkbox_css from './checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css
import React, { useState, useEffect, useRef } from 'react';
import platillosApi from './../../api/platillosApi';

const AddPlatilloForm = () => {
    const [platillo, setPlatillo] = useState({
        PlatilloId: '',
        Categoria: '',
        NombrePlatillo: '',
        Descripcion: '',
        Imagen: '',
        Disponibilidad: '',
        SelectedVariant: 0,
        Variants: []
    });
    const [platillosList, setPlatillosList] = useState([]);
    const [buttonAction, setButtonAction] = useState("Agregar")

    const fetchResetPlatillo = () => {
        setPlatillo ({
            PlatilloId: '',
            Categoria: '',
            NombrePlatillo: '',
            Descripcion: '',
            Imagen: '',
            Disponibilidad: '',
            SelectedVariant: 0,
            Variants: []
        })
    }

    const handleToggleButtonAction = () => {
        buttonAction === "Actualizar"
        ? setButtonAction("Agregar")
        : setButtonAction("Agregar")
    }

    const fetchPlatilloId = () => {
        platillosApi.getLastPlatilloId()
        .then(data => {
            // Asignar ${data + 1}
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...prevPlatillo, PlatilloId: data + 1 };
                    return newPlatillo;
            })
        })
    }

    useEffect(() => {
        fetchPlatilloId();
    },[]);

    const fetchPlatillos = () => {
        platillosApi.getPlatillos()
        .then(data => {
            setPlatillosList(prevPlatillosList => {
                return data;
            });
        })
    };

    useEffect (() => {
        fetchPlatillos();
    }, []);

    const fetchPlatilloToEdit = (id) => {
        platillosApi.getPlatillo(id)
        .then(data => {
            setPlatillo(prevPlatillo => {
                const newPlatillo = { ...prevPlatillo, ...data };
                    return newPlatillo;
            })
            setButtonAction("Actualizar")
        })
    };
    
    const handleEditPlatillo = (id) => {
        fetchPlatilloToEdit(id);
    };

    const handleDeletePlatillo = (id) => {
        platillosApi.deletePlatillo(id)
        .then(data => {
            fetchPlatillos();
        })
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (buttonAction === "Agregar") {
            platillosApi.addPlatillo(platillo)
            .then(() =>{
                alert("Platillo agregado correctamente");
                fetchResetPlatillo();
                fetchPlatillos();
                handleToggleButtonAction();
            })
        } else if (buttonAction === "Actualizar") {
            platillosApi.updatePlatillo(platillo)
            .then(() => {
                alert("Platillo actualizado correctamente");
                fetchResetPlatillo();
                fetchPlatillos();
                handleToggleButtonAction();
            })
        }
    };

    const handleCancelPlatillo = () => {
        fetchResetPlatillo();
        fetchPlatillos();
        handleToggleButtonAction();
        fetchPlatilloId();
    }

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
            <div className="row"><div className="col-12">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Categoría</th>
                            <th>Nombre</th>
                            <th>Disponibilidad</th>
                            <th>Acciones</th>
                            {/* Otros encabezados */}
                        </tr>
                    </thead>
                    <tbody>
                        {platillosList.map(item => (
                            <tr key={item.PlatilloId}>
                                <td>{item.PlatilloId}</td>
                                <td>{item.Categoria}</td>
                                <td>{item.NombrePlatillo}</td>
                                <td>{item.Disponibilidad}</td>
                                <td>
                                    <button className="btn btn-warning" onClick={() => handleEditPlatillo(item.PlatilloId)}>Editar</button>
                                    <button className="btn btn-danger" onClick={() => handleDeletePlatillo(item.PlatilloId)}>Eliminar</button>
                                </td>
                                {/* Otros datos */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div></div>
            <div className="row"><div className="col-12">
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
            </div></div>
        </div></div>
    );
};

export default AddPlatilloForm;

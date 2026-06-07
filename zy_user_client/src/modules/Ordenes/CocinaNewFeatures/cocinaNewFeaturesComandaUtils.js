export const getComandaVariantName = (comanda) =>
    comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName?.trim() ?? '';

export const isTacoDeBirria = (comanda) => {
    const platillo = comanda.Platillo?.trim().toLowerCase() ?? '';
    const variantName = getComandaVariantName(comanda).toLowerCase();
    return platillo === 'taco de birria' || variantName === 'taco de birria';
};

export const getKitchenDisplayPlatilloName = (comanda) => {
    if (isTacoDeBirria(comanda)) return 'Birria';
    return comanda.Platillo ?? '';
};

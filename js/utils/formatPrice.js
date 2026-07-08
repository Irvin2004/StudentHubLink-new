export function formatCurrency(value, {
    locale = "en-ZA",
    minimumFractionDigits,
    maximumFractionDigits
} = {}) {
    return `R${Number(value || 0).toLocaleString(locale, {
        minimumFractionDigits,
        maximumFractionDigits
    })}`;
}

export function formatPrice(price) {
    const amount =
        Number(price || 0);

    return amount > 0 ?
        formatCurrency(amount) :
        "FREE";
}

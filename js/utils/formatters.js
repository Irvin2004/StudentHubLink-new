export const formatCurrency = (value) =>
`R${Number(value || 0).toLocaleString("en-ZA")}`;

export const formatResourcePrice = (value) => {
    const amount =
    Number(value || 0);

    return amount === 0 ? "FREE" : formatCurrency(amount);
};

export const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

    return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

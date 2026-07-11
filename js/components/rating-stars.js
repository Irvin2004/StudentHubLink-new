export function createRatingStars(
    rating = 0,
    reviewCount = 0
) {
    const roundedRating = Number(rating) || 0;

    let stars = "";

    for (let i = 1; i <= 5; i++) {
        stars += i <= Math.round(roundedRating)
            ? "★"
            : "☆";
    }

    return `
        <div class="rating-stars">
            <span class="stars">
                ${stars}
            </span>

            <span class="rating-value">
                ${roundedRating.toFixed(1)}
            </span>

            <span class="review-count">
                (${reviewCount})
            </span>
        </div>
    `;
}

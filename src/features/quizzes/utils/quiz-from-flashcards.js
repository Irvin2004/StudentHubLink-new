function clean(value) {
    return String(value || "").trim();
}

export function canCreateQuizFromFlashcards(cards = []) {
    return (
        new Set(
            cards
                .filter((card) => clean(card.front) && clean(card.back))
                .map((card) => clean(card.back))
        ).size >= 4
    );
}

export function buildQuizQuestionsFromFlashcards(cards = []) {
    if (!canCreateQuizFromFlashcards(cards)) {
        throw new TypeError(
            "A deck needs at least four cards with different answers to create a quiz."
        );
    }

    const validCards = cards.filter(
        (card) => clean(card.front) && clean(card.back)
    );

    return validCards.map((card, position) => {
        const correctAnswer = clean(card.back);
        const distractors = [];
        for (let offset = 1; offset < validCards.length; offset += 1) {
            const candidate = clean(
                validCards[(position + offset) % validCards.length].back
            );
            if (
                candidate &&
                candidate !== correctAnswer &&
                !distractors.includes(candidate)
            ) {
                distractors.push(candidate);
            }
            if (distractors.length === 3) break;
        }

        const correctOptionIndex = position % 4;
        const options = distractors.slice(0, 3);
        options.splice(correctOptionIndex, 0, correctAnswer);

        return {
            correctOptionIndex,
            options,
            position,
            prompt: clean(card.front),
            sourceFlashcardId: card.id
        };
    });
}

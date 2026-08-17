export function scoreQuiz(questions = [], answers = {}) {
    const results = questions.map((question) => {
        const selectedOptionIndex = Number.isInteger(answers[question.id])
            ? answers[question.id]
            : null;
        return {
            correct: selectedOptionIndex === question.correctOptionIndex,
            correctOptionIndex: question.correctOptionIndex,
            questionId: question.id,
            selectedOptionIndex
        };
    });
    const score = results.filter((result) => result.correct).length;
    const total = questions.length;
    return {
        incorrect: total - score,
        percentage: total ? Math.round((score / total) * 100) : 0,
        results,
        score,
        total
    };
}

import { useCallback, useEffect, useMemo, useState } from "react";

import { QUESTION_STATUS } from "../models/community-question.js";
import {
    acceptAnswer as acceptAnswerRecord,
    createAnswer as createAnswerRecord,
    createComment as createCommentRecord,
    createQuestion as createQuestionRecord,
    deleteAnswer as deleteAnswerRecord,
    deleteComment as deleteCommentRecord,
    deleteQuestion as deleteQuestionRecord,
    getCommunityQuestionResources,
    subscribeToAnswers,
    subscribeToComments,
    subscribeToQuestions,
    toggleAnswerUpvote as toggleAnswerUpvoteRecord,
    updateAnswer as updateAnswerRecord,
    updateComment as updateCommentRecord,
    updateQuestion as updateQuestionRecord
} from "../services/community-question-service.js";

export function useCommunityQuestions(communityId, actor) {
    const [questions, setQuestions] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(Boolean(communityId));
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!communityId) return undefined;
        return subscribeToQuestions(
            communityId,
            (nextQuestions) => {
                setQuestions(nextQuestions);
                setLoading(false);
                setError(null);
            },
            (nextError) => {
                setError(nextError);
                setLoading(false);
            }
        );
    }, [communityId]);

    useEffect(() => {
        if (!communityId) return;
        let active = true;
        void getCommunityQuestionResources(communityId)
            .then((items) => {
                if (active) setResources(items);
            })
            .catch(() => {
                if (active) setResources([]);
            });
        return () => {
            active = false;
        };
    }, [communityId]);

    const filteredQuestions = useMemo(
        () =>
            filter === "all"
                ? questions
                : questions.filter((question) => question.status === filter),
        [filter, questions]
    );
    const subscribeAnswers = useCallback(
        (questionId, onData, onError) =>
            subscribeToAnswers(communityId, questionId, onData, onError),
        [communityId]
    );
    const subscribeComments = useCallback(
        (questionId, answerId, onData, onError) =>
            subscribeToComments(
                communityId,
                questionId,
                answerId,
                onData,
                onError
            ),
        [communityId]
    );

    return {
        error,
        filter,
        loading,
        questions: filteredQuestions,
        resources,
        setFilter,
        createQuestion: (input) =>
            createQuestionRecord(communityId, actor, input),
        updateQuestion: (id, input) =>
            updateQuestionRecord(communityId, id, input),
        deleteQuestion: (id) => deleteQuestionRecord(communityId, id),
        createAnswer: (questionId, content) =>
            createAnswerRecord(communityId, questionId, actor, content),
        updateAnswer: (questionId, answerId, content) =>
            updateAnswerRecord(communityId, questionId, answerId, content),
        deleteAnswer: (questionId, answerId) =>
            deleteAnswerRecord(communityId, questionId, answerId),
        acceptAnswer: (questionId, answerId) =>
            acceptAnswerRecord(communityId, questionId, answerId),
        toggleAnswerUpvote: (questionId, answerId) =>
            toggleAnswerUpvoteRecord(
                communityId,
                questionId,
                answerId,
                actor.id
            ),
        subscribeAnswers,
        createComment: (questionId, answerId, content) =>
            createCommentRecord(
                communityId,
                questionId,
                answerId,
                actor,
                content
            ),
        updateComment: (questionId, answerId, commentId, content) =>
            updateCommentRecord(
                communityId,
                questionId,
                answerId,
                commentId,
                content
            ),
        deleteComment: (questionId, answerId, commentId) =>
            deleteCommentRecord(communityId, questionId, answerId, commentId),
        subscribeComments,
        statuses: QUESTION_STATUS
    };
}

export function useQuestionAnswers(questionId, subscribeAnswers) {
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(Boolean(questionId));
    const [error, setError] = useState(null);

    const handleData = useCallback((items) => {
        setAnswers(items);
        setLoading(false);
        setError(null);
    }, []);

    useEffect(() => {
        if (!questionId) return undefined;
        return subscribeAnswers(questionId, handleData, (nextError) => {
            setError(nextError);
            setLoading(false);
        });
    }, [handleData, questionId, subscribeAnswers]);

    return { answers, error, loading };
}

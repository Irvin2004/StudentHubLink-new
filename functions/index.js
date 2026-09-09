exports.updateResourceRating =
    require("./reviews/review-functions").updateResourceRating;

const reputation = require("./reputation/reputation-functions");

exports.onAnswerReputationChanged = reputation.onAnswerReputationChanged;
exports.onAnswerUpvoteCreated = reputation.onAnswerUpvoteCreated;
exports.onAnswerUpvoteDeleted = reputation.onAnswerUpvoteDeleted;
exports.onQuestionUpvoteCreated = reputation.onQuestionUpvoteCreated;
exports.onQuestionUpvoteDeleted = reputation.onQuestionUpvoteDeleted;
exports.onCommunityResourceCreated = reputation.onCommunityResourceCreated;
exports.onCommunityResourceDeleted = reputation.onCommunityResourceDeleted;
exports.onCommunityMemberChanged = reputation.onCommunityMemberChanged;
exports.onQuestionDeleted = reputation.onQuestionDeleted;
exports.onKnowledgeCollectionDeleted = reputation.onKnowledgeCollectionDeleted;
exports.onCommunityDeleted = reputation.onCommunityDeleted;
exports.recalculateCommunityReputation =
    reputation.recalculateCommunityReputation;

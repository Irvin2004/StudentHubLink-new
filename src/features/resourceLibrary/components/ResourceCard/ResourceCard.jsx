import Button from "../../../../components/ui/Button/index.js";
import FileIcon from "../../../../components/files/FileIcon/FileIcon.jsx";
import { formatFileSize } from "../../../../utils/file-size.js";
import { isPreviewableFile } from "../../../../utils/file-icons.js";
import {
    getResourceTypeLabel,
    RESOURCE_ACTIONS
} from "../../utils/resource-library.js";
import styles from "./ResourceCard.module.css";

function formatUploadDate(value) {
    const date =
        typeof value?.toDate === "function"
            ? value.toDate()
            : value instanceof Date
              ? value
              : new Date(value || Date.now());

    return UPLOAD_DATE_FORMATTER.format(date);
}

const UPLOAD_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
});

export const ResourceCard = memo(function ResourceCard({
    addingToPlanner,
    creatingDeck,
    favorite,
    favoritePending,
    highlighted = false,
    onAction,
    resource,
    view = "grid"
}) {
    return (
        <article
            aria-current={highlighted ? "true" : undefined}
            className={`${styles.card} ${styles[view]} ${highlighted ? styles.highlighted : ""}`}
            data-resource-key={resource.resourceKey}
        >
            <div className={styles.iconWrap}>
                <FileIcon extension={resource.extension} />
                <span className={styles.typeBadge}>
                    {getResourceTypeLabel(resource)}
                </span>
            </div>
            <div className={styles.content}>
                <div className={styles.heading}>
                    <div>
                        <h2 title={resource.title}>{resource.title}</h2>
                        <p className={styles.fileName}>
                            {resource.originalName}
                        </p>
                    </div>
                    <button
                        aria-label={`${favorite ? "Remove" : "Add"} ${resource.title} ${favorite ? "from" : "to"} favourites`}
                        aria-pressed={favorite}
                        className={`${styles.favorite} ${favorite ? styles.favoriteActive : ""}`}
                        disabled={favoritePending}
                        onClick={() =>
                            onAction(RESOURCE_ACTIONS.TOGGLE_FAVORITE, resource)
                        }
                        type="button"
                    >
                        <span aria-hidden="true">
                            {favorite ? "\u2665" : "\u2661"}
                        </span>
                    </button>
                </div>
                <dl className={styles.meta}>
                    <div>
                        <dt>Community</dt>
                        <dd>{resource.communityName}</dd>
                    </div>
                    <div>
                        <dt>Uploader</dt>
                        <dd>{resource.uploadedByName}</dd>
                    </div>
                    <div>
                        <dt>Uploaded</dt>
                        <dd>{formatUploadDate(resource.uploadedAt)}</dd>
                    </div>
                    <div>
                        <dt>Size</dt>
                        <dd>{formatFileSize(resource.size)}</dd>
                    </div>
                </dl>
            </div>
            <div className={styles.actions}>
                {isPreviewableFile(resource) ? (
                    <Button
                        onClick={() =>
                            onAction(RESOURCE_ACTIONS.PREVIEW, resource)
                        }
                        variant="outline"
                    >
                        Preview
                    </Button>
                ) : null}
                <Button
                    onClick={() =>
                        onAction(RESOURCE_ACTIONS.DOWNLOAD, resource)
                    }
                    variant="outline"
                >
                    Download
                </Button>
                <Button
                    loading={addingToPlanner}
                    loadingLabel="Adding"
                    onClick={() =>
                        onAction(RESOURCE_ACTIONS.ADD_TO_PLANNER, resource)
                    }
                    variant="secondary"
                >
                    Add to Study Planner
                </Button>
                <Button
                    loading={creatingDeck}
                    loadingLabel="Creating deck"
                    onClick={() =>
                        onAction(
                            RESOURCE_ACTIONS.CREATE_FLASHCARD_DECK,
                            resource
                        )
                    }
                    variant="secondary"
                >
                    Create Flashcard Deck
                </Button>
                <Button
                    onClick={() =>
                        onAction(RESOURCE_ACTIONS.START_SESSION, resource)
                    }
                >
                    Start Session
                </Button>
            </div>
        </article>
    );
});

export default ResourceCard;
import { memo } from "react";

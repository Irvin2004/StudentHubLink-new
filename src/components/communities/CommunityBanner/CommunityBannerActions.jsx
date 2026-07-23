import Button from "../../ui/Button/index.js";
import styles from "./CommunityBannerActions.module.css";

export default function CommunityBannerActions({
    canManage = false,
    hasBanner = false,
    onRemove,
    onUpload
}) {
    if (!canManage) return null;

    return (
        <div className={styles.actions}>
            <Button onClick={onUpload} size="small" variant="secondary">
                {hasBanner ? "Replace banner" : "Upload banner"}
            </Button>
            {hasBanner ? (
                <Button onClick={onRemove} size="small" variant="ghost">
                    Remove
                </Button>
            ) : null}
        </div>
    );
}

import styles from "./Skeleton.module.css";

const VARIANTS = new Set(["circle", "rectangle", "text"]);

export default function Skeleton({
    borderRadius,
    className = "",
    count = 1,
    height,
    style,
    variant = "text",
    width
}) {
    const placeholderCount = Math.max(1, Number.parseInt(count, 10) || 1);
    const safeVariant = VARIANTS.has(variant) ? variant : "text";
    const groupClassName = [styles.group, className].filter(Boolean).join(" ");

    return (
        <span aria-hidden="true" className={groupClassName}>
            {Array.from({ length: placeholderCount }, (_, index) => (
                <span
                    className={`${styles.skeleton} ${styles[safeVariant]}`}
                    data-skeleton
                    key={index}
                    style={{
                        ...style,
                        borderRadius,
                        height,
                        width
                    }}
                />
            ))}
        </span>
    );
}

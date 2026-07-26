import styles from "./DateDivider.module.css";

export default function DateDivider({ label }) {
    return (
        <div className={styles.divider} role="separator">
            <span>{label}</span>
        </div>
    );
}

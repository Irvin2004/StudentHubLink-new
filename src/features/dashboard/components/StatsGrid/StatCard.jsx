import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./StatsGrid.module.css";

export function StatCard({ color = "blue", icon, loading = false, title, value }) {
    return (
        <article className={`${styles.card} ${styles[color] || ""}`}>
            <div className={styles.iconWrap}>{loading ? <Skeleton variant="circle" width="1.75rem" height="1.75rem" /> : icon}</div>
            {loading ? (
                <>
                    <Skeleton width="7rem" />
                    <Skeleton height="2.4rem" width="3rem" />
                </>
            ) : (
                <>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.value}>{value}</p>
                </>
            )}
        </article>
    );
}

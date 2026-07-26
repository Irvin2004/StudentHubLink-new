import styles from "./ChannelEmptyState.module.css";

export default function ChannelEmptyState({ selected = false }) {
    return (
        <section className={styles.state}>
            <div aria-hidden="true" className={styles.mark}>
                #
            </div>
            <h2>
                {selected ? "Messages are coming next" : "Select a channel"}
            </h2>
            <p>
                {selected
                    ? "This channel is ready. Chat and collaboration tools will arrive in the next sprint."
                    : "Choose a channel from the sidebar to start participating."}
            </p>
        </section>
    );
}

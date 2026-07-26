import EmptyState from "../../EmptyState/EmptyState.jsx";

export default function ChannelEmptyState({ selected = false }) {
    return (
        <EmptyState
            description={
                selected
                    ? "This channel is ready for your community."
                    : "Choose a channel from the sidebar to start participating."
            }
            icon="#"
            title={selected ? "Channel ready" : "Select a channel"}
        />
    );
}

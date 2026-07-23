import { useId, useState } from "react";

import { cx } from "../utils.js";
import styles from "./Tabs.module.css";

/**
 * Renders controlled or uncontrolled accessible tabs.
 */
export default function Tabs({
    activeId,
    className,
    defaultActiveId,
    items = [],
    onChange
}) {
    const baseId = useId();
    const [internalId, setInternalId] = useState(
        defaultActiveId || items[0]?.id
    );
    const selectedId = activeId ?? internalId;
    const selected = items.find((item) => item.id === selectedId) || items[0];

    function select(id) {
        if (activeId === undefined) setInternalId(id);
        onChange?.(id);
    }

    function handleKeyDown(event) {
        const enabled = items.filter((item) => !item.disabled);
        const index = enabled.findIndex((item) => item.id === selectedId);
        let next;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            next = enabled[(index + 1) % enabled.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            next = enabled[(index - 1 + enabled.length) % enabled.length];
        } else if (event.key === "Home") {
            next = enabled[0];
        } else if (event.key === "End") {
            next = enabled.at(-1);
        }

        if (next) {
            event.preventDefault();
            select(next.id);
            document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
        }
    }

    return (
        <div className={cx(styles.tabs, className)}>
            <div
                aria-label="Tabs"
                className={styles.list}
                onKeyDown={handleKeyDown}
                role="tablist"
            >
                {items.map((item) => {
                    const active = item.id === selected?.id;

                    return (
                        <button
                            aria-controls={`${baseId}-panel-${item.id}`}
                            aria-selected={active}
                            className={cx(styles.tab, active && styles.active)}
                            disabled={item.disabled}
                            id={`${baseId}-tab-${item.id}`}
                            key={item.id}
                            onClick={() => select(item.id)}
                            role="tab"
                            tabIndex={active ? 0 : -1}
                            type="button"
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
            {selected ? (
                <div
                    aria-labelledby={`${baseId}-tab-${selected.id}`}
                    className={styles.panel}
                    id={`${baseId}-panel-${selected.id}`}
                    role="tabpanel"
                    tabIndex={0}
                >
                    {selected.content}
                </div>
            ) : null}
        </div>
    );
}

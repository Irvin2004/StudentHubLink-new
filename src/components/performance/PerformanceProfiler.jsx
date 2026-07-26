import { Profiler } from "react";

import { useObservability } from "../../hooks/useObservability.js";

export default function PerformanceProfiler({ children, id }) {
    const { recordRender } = useObservability();
    if (!import.meta.env.DEV) return children;

    return (
        <Profiler id={id} onRender={recordRender}>
            {children}
        </Profiler>
    );
}

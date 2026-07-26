import { useDeferredValue, useMemo, useState } from "react";

import { LoadErrorState } from "../../common/LoadErrorState.jsx";
import SearchInput from "../../ui/SearchInput/index.js";
import FileCardSkeleton from "../../Skeleton/FileCardSkeleton.jsx";
import FileActions from "../FileActions/FileActions.jsx";
import FileGrid from "../FileGrid/FileGrid.jsx";
import FileIcon from "../FileIcon/FileIcon.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import { formatFileSize } from "../../../utils/file-size.js";
import styles from "./FileList.module.css";

function timestamp(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    return value instanceof Date ? value.getTime() : Number(value) || 0;
}

export default function FileList({
    currentUserId,
    error,
    files = [],
    loading,
    onDelete,
    onDownload,
    role
}) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("newest");
    const [view, setView] = useState("grid");
    const [preview, setPreview] = useState(null);
    const deferredQuery = useDeferredValue(query.trim().toLowerCase());
    const visibleFiles = useMemo(() => {
        const matched = files.filter((file) =>
            [file.originalName, file.extension, file.uploadedByName]
                .join(" ")
                .toLowerCase()
                .includes(deferredQuery)
        );
        return [...matched].sort((a, b) => {
            if (sort === "oldest")
                return timestamp(a.uploadedAt) - timestamp(b.uploadedAt);
            if (sort === "largest") return b.size - a.size;
            if (sort === "smallest") return a.size - b.size;
            if (sort === "alphabetical")
                return a.originalName.localeCompare(b.originalName);
            return timestamp(b.uploadedAt) - timestamp(a.uploadedAt);
        });
    }, [deferredQuery, files, sort]);

    const common = {
        currentUserId,
        onDelete,
        onDownload,
        onPreview: setPreview,
        role
    };

    return (
        <section
            aria-labelledby="channel-files-title"
            className={styles.browser}
        >
            <div className={styles.header}>
                <div>
                    <h2 id="channel-files-title">Shared files</h2>
                    <p>
                        {files.length} {files.length === 1 ? "file" : "files"}{" "}
                        in this channel
                    </p>
                </div>
                <div className={styles.controls}>
                    <SearchInput
                        label="Search files"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search filename, type or uploader"
                        value={query}
                    />
                    <label>
                        <span className={styles.srOnly}>Sort files</span>
                        <select
                            onChange={(event) => setSort(event.target.value)}
                            value={sort}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="largest">Largest</option>
                            <option value="smallest">Smallest</option>
                            <option value="alphabetical">Alphabetical</option>
                        </select>
                    </label>
                    <div aria-label="File view" className={styles.viewToggle}>
                        <button
                            aria-pressed={view === "grid"}
                            onClick={() => setView("grid")}
                            type="button"
                        >
                            Grid
                        </button>
                        <button
                            aria-pressed={view === "list"}
                            onClick={() => setView("list")}
                            type="button"
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>
            {loading ? (
                <FileCardSkeleton />
            ) : error && !files.length ? (
                <LoadErrorState
                    description="We could not load the files shared in this channel."
                    title="Files unavailable"
                />
            ) : visibleFiles.length ? (
                view === "grid" ? (
                    <FileGrid files={visibleFiles} {...common} />
                ) : (
                    <div className={styles.rows}>
                        {visibleFiles.map((file) => (
                            <article className={styles.row} key={file.id}>
                                <FileIcon
                                    extension={file.extension}
                                    size="small"
                                />
                                <div>
                                    <strong>{file.originalName}</strong>
                                    <p>
                                        {formatFileSize(file.size)} ·{" "}
                                        {file.uploadedByName}
                                    </p>
                                </div>
                                <FileActions file={file} {...common} />
                            </article>
                        ))}
                    </div>
                )
            ) : (
                <div className={styles.empty}>
                    <span aria-hidden="true">↥</span>
                    <h3>
                        {query ? "No matching files" : "No files shared yet"}
                    </h3>
                    <p>
                        {query
                            ? "Try a different filename, extension or uploader."
                            : "Upload assignments, notes and resources for everyone in this channel."}
                    </p>
                </div>
            )}
            <FilePreview
                file={preview}
                onClose={() => setPreview(null)}
                onDownload={onDownload}
            />
        </section>
    );
}

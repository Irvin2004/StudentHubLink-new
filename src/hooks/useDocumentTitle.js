import { useEffect } from "react";

export function useDocumentTitle(title, page) {
    useEffect(() => {
        const previousTitle = document.title;
        const previousPage = document.body.dataset.page;

        document.title = title;
        document.body.dataset.page = page;

        return () => {
            document.title = previousTitle;

            if (previousPage) {
                document.body.dataset.page = previousPage;
            } else {
                delete document.body.dataset.page;
            }
        };
    }, [page, title]);
}

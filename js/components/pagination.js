import { escapeHtml } from "../utils/dom.js";

export function createPagination({ currentPage = 1, totalPages = 1, label = "Pagination" } = {}) {
    const total = Math.max(1, Number(totalPages) || 1);
    const current = Math.min(total, Math.max(1, Number(currentPage) || 1));
    const pages = Array.from({ length: total }, (_, index) => index + 1);

    return `<nav class="pagination" aria-label="${escapeHtml(label)}"><button class="btn btn-secondary btn-sm" data-page="${current - 1}" ${current === 1 ? "disabled" : ""}>Previous</button>${pages.map((page) => `<button class="btn btn-secondary btn-sm${page === current ? " is-active" : ""}" data-page="${page}" aria-current="${page === current ? "page" : "false"}">${page}</button>`).join("")}<button class="btn btn-secondary btn-sm" data-page="${current + 1}" ${current === total ? "disabled" : ""}>Next</button></nav>`;
}

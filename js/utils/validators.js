export const allowedResourceTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/zip",
    "application/x-zip-compressed"
];

export const maxResourceSize =
20 * 1024 * 1024;

export const isAllowedResourceType = (file) =>
allowedResourceTypes.includes(file?.type);

export const isAllowedResourceSize = (file) =>
Number(file?.size || 0) <= maxResourceSize;

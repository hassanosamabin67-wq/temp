export const getBrandedNameParts = (firstName = "", lastName = "") => {
    return {
        prefix: "K.",
        name: `${firstName} ${lastName}`.trim(),
    };
};
const mergeClassNames = (...classNames: Array<string | undefined | null | false>): string =>
    classNames.filter((className) => Boolean(className)).join(" ");

export { mergeClassNames };

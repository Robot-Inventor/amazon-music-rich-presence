import type { ComponentPropsWithRef, ReactNode } from "react";
import { mergeClassNames } from "../../utils/mergeClassNames";
import { textButtonStyles } from "./TextButton.css";

const TextButton = ({ className, ref, type = "button", ...props }: ComponentPropsWithRef<"button">): ReactNode => (
    <button {...props} className={mergeClassNames(textButtonStyles, className)} ref={ref} type={type} />
);

export { TextButton };

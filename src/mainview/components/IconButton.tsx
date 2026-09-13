import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import type { LucideProps } from "lucide-react";
import { buttonStyles } from "./IconButton.css";
import { mergeClassNames } from "../../utils/mergeClassNames";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode & Omit<LucideProps, "ref">;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ children, className, ...props }, ref) => (
    <button {...props} className={mergeClassNames(buttonStyles, className)} ref={ref} type="button">
        {children}
    </button>
));

export { IconButton };

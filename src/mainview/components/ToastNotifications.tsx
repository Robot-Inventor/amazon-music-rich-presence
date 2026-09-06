import {
    toastCloseStyles,
    toastContentStyles,
    toastDescriptionStyles,
    toastStyles,
    toastTitleStyles,
    toastViewportStyles
} from "./ToastNotifications.css";
import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { themeClass } from "../theme.css";

interface ToastNotificationsProps {
    children: ReactNode;
}

const ToastList = (): ReactNode => {
    const { toasts } = Toast.useToastManager();

    return (
        <Toast.Portal className={themeClass}>
            <Toast.Viewport className={toastViewportStyles}>
                {toasts.map((toast) => (
                    <Toast.Root className={toastStyles} key={toast.id} toast={toast}>
                        <Toast.Content className={toastContentStyles}>
                            <Toast.Title className={toastTitleStyles} />
                            <Toast.Description className={toastDescriptionStyles} />
                            <Toast.Close aria-label="Dismiss" className={toastCloseStyles}>
                                Dismiss
                            </Toast.Close>
                        </Toast.Content>
                    </Toast.Root>
                ))}
            </Toast.Viewport>
        </Toast.Portal>
    );
};

const ToastNotifications = ({ children }: ToastNotificationsProps): ReactNode => (
    <Toast.Provider timeout={5000}>
        {children}
        <ToastList />
    </Toast.Provider>
);

export { ToastNotifications };

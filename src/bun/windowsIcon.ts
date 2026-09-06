import { FFIType, type Pointer, dlopen, ptr } from "bun:ffi";

const ICON_BIG = 1;
const ICON_SMALL = 0;
const ICON_SMALL_2 = 2;
const ICON_BIG_SIZE = 32;
const ICON_SMALL_SIZE = 16;
const IMAGE_ICON = 1;
const LR_LOADFROMFILE = 0x10;
const WM_GETICON = 0x007f;
const WM_SETICON = 0x0080;

const user32 = dlopen("user32.dll", {
    DestroyIcon: {
        args: [FFIType.ptr],
        returns: FFIType.bool
    },
    LoadImageW: {
        args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32],
        returns: FFIType.ptr
    },
    SendMessageW: {
        args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr],
        returns: FFIType.i64
    }
});
const { DestroyIcon: destroyIcon, LoadImageW: loadImage, SendMessageW: sendMessage } = user32.symbols;

const loadIcon = (iconPath: string, size: number): Pointer | bigint | null => {
    const wideIconPath = Buffer.from(`${iconPath}\0`, "utf16le");
    return loadImage(null, ptr(wideIconPath), IMAGE_ICON, size, size, LR_LOADFROMFILE);
};

const setWindowsWindowIcon = (window: Pointer, iconPath: string): boolean => {
    const bigIcon = loadIcon(iconPath, ICON_BIG_SIZE);
    const smallIcon = loadIcon(iconPath, ICON_SMALL_SIZE);
    if (!bigIcon || !smallIcon) {
        if (bigIcon) destroyIcon(bigIcon);
        if (smallIcon) destroyIcon(smallIcon);
        return false;
    }

    sendMessage(window, WM_SETICON, ICON_BIG, bigIcon);
    sendMessage(window, WM_SETICON, ICON_SMALL, smallIcon);

    return (
        Boolean(sendMessage(window, WM_GETICON, ICON_BIG, null)) &&
        Boolean(sendMessage(window, WM_GETICON, ICON_SMALL, null)) &&
        Boolean(sendMessage(window, WM_GETICON, ICON_SMALL_2, null))
    );
};

export { setWindowsWindowIcon };

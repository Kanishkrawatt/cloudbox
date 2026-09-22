import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import Icon, { IconName } from '@/components/ui/icons';
import { datatype, themeType } from '../types'
import { useRouter } from 'next/router';
import OptionsModal from '../modals/optionsModal';
import { shareThese } from '@/utils/shareHandoff';

export type ModalState = Dispatch<SetStateAction<ModalObject>>
export type ActionState =
    | "open" | "openTab" | "rename" | "move" | "share" | "smartshare" | "download" | "delete";

/** Menu entries in display order; a divider is drawn before "delete". */
const OPTIONS: { name: ActionState; label: string; icon: IconName }[] = [
    { name: "open", label: "Preview", icon: "eye" },
    { name: "openTab", label: "Open in new tab", icon: "external" },
    { name: "download", label: "Download", icon: "download" },
    { name: "share", label: "Copy link", icon: "link" },
    { name: "smartshare", label: "Smart Share…", icon: "share" },
    { name: "rename", label: "Rename", icon: "edit" },
    { name: "move", label: "Move to folder", icon: "folder" },
    { name: "delete", label: "Delete", icon: "trash" },
];
export type ModalObject = {
    status: string;
    item: {
        name: string;
        url: string;
    };
}

export const Actions = ({ theme, item, index, menu, setMenu, variant = "row" }: {
    theme: themeType,
    item: datatype,
    index: number
    menu : number
    setMenu : Dispatch<SetStateAction<number>>
    /** "tile" sits on top of a thumbnail and matches the round select control. */
    variant?: "tile" | "row"
}) => {
    const router = useRouter();
    const [modal, setModal] = useState<ModalObject>({ status: "", item: { name: "", url: "" } })
    const handleClick = (index: number) => {
        if (index !== menu) setMenu(index);
        else setMenu(-1);
    };
    const handleAction = (action: ActionState, item: datatype) => {
        switch (action) {
            case "download":
                return handleDownload(item);
            case "openTab":
                return window.open(item.url, "_blank", "noopener");
            case "smartshare":
                return shareThese(router, {
                    name: item.name ?? "Shared file",
                    files: [{ url: item.url, name: item.name, type: item.type }],
                });
            default:
                setModal({ status: action, item });
        }
    }
    const handleDownload = async (item: datatype) => {
        fetch(item.url)
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${item.name}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    }
    const open = index !== -1 && menu === index;
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside or Escape; the tile's hover-only visibility used
    // to leave a menu open with no way to dismiss it on touch screens.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenu(-1);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(-1);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, setMenu]);
    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                aria-label={open ? "Close actions" : "File actions"}
                aria-expanded={open}
                className={
                    variant === "tile"
                        ? "flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors"
                        : "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface)]"
                }
                style={
                    variant === "tile"
                        ? {
                              backgroundColor: open ? theme.accent : "rgba(0,0,0,0.45)",
                              color: open ? theme.primary : "#fff",
                          }
                        : { color: open ? theme.text : theme.muted }
                }
                onClick={(e) => {
                    e.stopPropagation();
                    handleClick(index);
                }}
            >
                <Icon name={open ? "close" : "more"} size={16} strokeWidth={2.4} />
            </button>
            {open && (
                <div role="menu" className="menu absolute right-0 top-8 z-40 w-48 p-1.5">
                    {OPTIONS.map((option) => (
                        <React.Fragment key={option.name}>
                            {option.name === "delete" && (
                                <div className="my-1 border-t" style={{ borderColor: theme.border }} />
                            )}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    handleAction(option.name, item);
                                    setMenu(-1);
                                }}
                                className="menu-item text-[13px]"
                                style={option.name === "delete" ? { color: "#e5484d" } : undefined}
                            >
                                <Icon name={option.icon} size={15} />
                                {option.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
            <OptionsModal modal={modal} setModal={setModal} item={item} />
        </div>
    )
}

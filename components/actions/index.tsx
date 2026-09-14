import React, { Dispatch, SetStateAction, useState } from 'react'
import Icon, { IconName } from '@/components/ui/icons';
import { datatype, themeType } from '../types'
import { options } from '../../utils/constant/index';
import OptionsModal from '../modals/optionsModal';

export type ModalState = Dispatch<SetStateAction<ModalObject>>
export type ActionState = "open" | "delete" | "share" | "download";
export type ModalObject = {
    status: string;
    item: {
        name: string;
        url: string;
    };
}
export enum Action {
    open = "open",
    delete = "delete",
    share = "share",
    download = "download"
}

export const Actions = ({ theme, item, index,menu,setMenu }: {
    theme: themeType,
    item: datatype,
    index: number
    menu : number
    setMenu : Dispatch<SetStateAction<number>>
}) => {
    const [modal, setModal] = useState<ModalObject>({ status: "", item: { name: "", url: "" } })
    const handleClick = (index: number) => {
        if (index !== menu) setMenu(index);
        else setMenu(-1);
    };
    const handleAction = (Actions: ActionState, item: datatype) => {
        switch (Actions) {
            case Action.open:
                setModal({ status: Action.open, item: item });
                break;
            case Action.delete:
                setModal({ status: Action.delete, item: item });
                break;
            case Action.share:
                setModal({ status: Action.share, item: item });
                break;
            case Action.download:
                handleDownload(item);
                break
            default:
                break;
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
    const ICONS: Record<string, IconName> = {
        open: "eye",
        share: "link",
        delete: "trash",
        download: "download",
    };
    return (
        <React.Fragment>
            <button
                type="button"
                aria-label={open ? "Close actions" : "File actions"}
                aria-expanded={open}
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ color: theme.muted }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleClick(index);
                }}
            >
                <Icon name={open ? "close" : "more"} size={16} strokeWidth={2} />
            </button>
            {open && (
                <div role="menu" className="menu absolute right-0 top-8 z-30 w-40 p-1.5">
                    {options.map((Optionitem, key) => (
                        <button
                            key={key}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                handleAction(Optionitem.name as ActionState, item);
                                setMenu(-1);
                            }}
                            className="menu-item text-[13px] capitalize"
                        >
                            <Icon name={ICONS[Optionitem.name] ?? "file"} size={15} />
                            {Optionitem.name}
                        </button>
                    ))}
                </div>
            )}
            <OptionsModal modal={modal} setModal={setModal} item={item} />
        </React.Fragment>
    )
}

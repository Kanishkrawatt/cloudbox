import React, { useState } from 'react'
import Image from 'next/image'
import { useTheme } from '@/utils/contexts/theme'

function OptionsModal({ modal, setModal, itemUrl }: {
    modal: { status: string, item: any },
    setModal: React.Dispatch<React.SetStateAction<{ status: string, item: any }>>,
    itemUrl: string
}) {
    switch (modal.status) {
        case "delete":
            return <DeleteItem modal={modal} setModal={setModal} itemUrl={itemUrl} />
        case "open":
            return <OpenItem modal={modal} setModal={setModal} itemUrl={itemUrl} />
        case "share":
            return <ShareItem modal={modal} setModal={setModal} itemUrl={itemUrl} />
        default:
            return <></>
    }
}

export const DeleteItem = ({ modal, setModal, itemUrl }: {
    modal: { status: string, item: any },
    setModal: React.Dispatch<React.SetStateAction<{ status: string, item: any }>>,
    itemUrl: string
}) => {
    const handleDelete = () => {
        fetch("/api/deleteItem", {
            method: "POST",
            body: JSON.stringify({ data: [itemUrl], deletefromDB: true }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setModal({ status: "closed", item: {} });
            });
        window.location.reload();
    };
    const { theme } = useTheme()
    return (
        <div className="h-[100vh] w-[100vw] flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center md:inset-0 max-h-full">
            <div className="relative p-4 w-full max-w-md max-h-full">
                <div className="relative rounded-lg shadow"
                    style={{
                        backgroundColor: theme?.secondary,
                        color: theme?.secondaryText,
                    }}
                >
                    <button
                        type="button"
                        className={`absolute top-3 end-2.5 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-[${theme.secondary}] hover:text-[${theme.secondaryText}] dark:hover:bg-[${theme.secondary}] dark:hover:text-[${theme.text}`}
                        style={{
                            color: theme?.secondaryText,
                        }}
                        onClick={() => setModal({ status: "closed", item: {} })}
                    >
                        <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="p-4 md:p-5 text-center">
                        <svg
                            className="mx-auto mb-4 w-12 h-12"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                        <h3 className="mb-5 text-lg font-normal ">
                            Are you sure you want to delete this product?
                        </h3>
                        <button
                            onClick={handleDelete}
                            data-modal-hide="popup-modal"
                            type="button"
                            className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                        >
                            Yes, I&apos;m sure
                        </button>
                        <button
                            onClick={() => setModal({ status: "closed", item: {} })}
                            type="button"
                            style={{
                                backgroundColor: theme?.primary,
                                color: theme?.secondaryText,
                            }}
                            className="py-2.5 px-5 ms-3 text-sm font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-4 "
                        >
                            No, cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const OpenItem = ({ modal, setModal, itemUrl }: {
    modal: { status: string, item: any },
    setModal: React.Dispatch<React.SetStateAction<{ status: string, item: any }>>,
    itemUrl: string
}) => {
    const { theme } = useTheme()
    return (
        <div className="h-[100vh] w-[100vw] flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center md:inset-0 max-h-full">
            <div className="relative p-4 w-full max-w-[80vw] max-h-full">
                <div className="relative rounded-lg shadow "
                    style={{
                        backgroundColor: theme?.secondary,
                        color: theme?.secondaryText,
                    }}
                >
                    <button
                        type="button"
                        className="absolute z-20 top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        onClick={() => setModal({ status: "closed", item: {} })}
                    >
                        <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="p-4 md:p-5 text-center z-30 ">
                        <div className="flex justify-center h-[80vh]">
                            <Image src={itemUrl} fill alt={''} className="object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export const ShareItem = ({ modal, setModal, itemUrl }: {
    modal: { status: string, item: any },
    setModal: React.Dispatch<React.SetStateAction<{ status: string, item: any }>>,
    itemUrl: string
}) => {
    const handleShare = () => {
        navigator.clipboard.writeText(itemUrl);
        setModal({ status: "closed", item: {} });
    };
    const { theme } = useTheme()

    return (
        <div className="h-[100vh] w-[100vw] flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center md:inset-0 max-h-full">
            <div className="relative p-4 w-full max-w-md max-h-full">
                <div className="relative shadow "
                    style={{
                        backgroundColor: theme?.secondary,
                        color: theme?.secondaryText,
                    }}
                >
                    <button
                        type="button"
                        className="absolute top-3 end-2.5 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                        onClick={() => setModal({ status: "closed", item: {} })}
                    >
                        <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="p-4 md:p-5 text-center">
                        <h3 className="mb-5 text-lg font-normal ">
                            Share this link
                        </h3>
                        <div className="flex justify-center items-center">
                            <input
                                type="text"
                                value={itemUrl}
                                className="w-full p-2 mr-3 text-center rounded-lg"
                                style={{
                                    backgroundColor: theme?.primary,
                                    color: theme?.secondaryText,
                                }}
                            />
                            <button
                                onClick={handleShare}
                                className="text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default OptionsModal

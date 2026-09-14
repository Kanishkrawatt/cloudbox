import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { themeType } from "@/components/types";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import { useSearch } from "@/utils/contexts/search";
import Icon from "@/components/ui/icons";

type FolderDataTypes = {
  name: string;
  date: string;
  size: number;
};

/** Folder strip on the dashboard, plus the create-folder dialog. */
const RecentFiles = ({ theme }: { theme: themeType }) => {
  const [data, setData] = useState<FolderDataTypes[]>([]);
  const [modal, setModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { query } = useSearch();

  const getFoldersData = useCallback(async () => {
    const folders = await axios
      .post("/api/getFolders", { uid: user?.uid })
      .then((res) => res.data.data as FolderDataTypes[]);
    setData(folders ?? []);
    setLoading(false);
  }, [user?.uid]);

  const createFolder = useCallback(
    (name: string) => {
      axios
        .post("/api/addFolder", { uid: user?.uid, folderName: name })
        .then(() => getFoldersData());
    },
    [getFoldersData, user?.uid]
  );

  useEffect(() => {
    if (!user?.uid) return;
    getFoldersData();
  }, [getFoldersData, user?.uid]);

  // Derived during render: calling setData here re-rendered forever.
  const q = query.trim().toLowerCase();
  const visible = q
    ? data.filter((item) => item.name?.toLowerCase().includes(q))
    : data;

  return (
    <section className="px-4 py-5 sm:px-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="section-label">Folders</h2>
        {!loading && (
          <span className="text-[11px]" style={{ color: theme.muted }}>
            {visible.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[3.25rem] rounded-lg" />
            ))
          : visible.map((item) => (
              <Link
                key={item.name}
                href={`/folder?name=${encodeURIComponent(item.name)}`}
                className="card flex items-center gap-2.5 px-3 py-3 text-[13px]"
                title={item.name}
              >
                <Icon name="folder" size={17} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}

        <button
          type="button"
          onClick={() => setModal(true)}
          className="card flex items-center gap-2.5 px-3 py-3 text-[13px]"
          style={{ color: theme.muted, borderStyle: "dashed" }}
        >
          <Icon name="plus" size={17} className="shrink-0" />
          New folder
        </button>
      </div>

      {modal && <CreateFolder addFolder={createFolder} setModal={setModal} />}
    </section>
  );
};

export default RecentFiles;

export const CreateFolder = ({
  addFolder,
  setModal,
}: {
  addFolder: (name: string) => void;
  setModal: (value: boolean) => void;
}) => {
  const { theme } = useTheme();
  const [folderName, setFolderName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim().length < 3) {
      setError("Folder name must be at least 3 characters");
      return;
    }
    addFolder(folderName.trim());
    setModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setModal(false)}
    >
      <form
        onSubmit={handleCreateFolder}
        onClick={(e) => e.stopPropagation()}
        className="menu w-full max-w-sm p-5"
        style={{ color: theme.text }}
      >
        <h3 className="page-title mb-4">New folder</h3>
        <input
          type="text"
          autoFocus
          placeholder="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="field h-10 text-[13px]"
          style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
        />
        {error && (
          <p className="mt-2 text-[12px]" style={{ color: "#e5484d" }}>
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn h-9 text-[13px]" onClick={() => setModal(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary h-9 text-[13px]">
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

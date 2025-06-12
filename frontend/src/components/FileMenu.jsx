// FileMenu.jsx

import React from "react";
import { Menu, MenuItem } from "@material-ui/core";
import Rename from "./Rename";
import Edit from "./Edit";
import Delete from "./Delete";
import FileSearchReplace from "./FileSearchReplace";
import FileSearchReplaceDialog from "./FileSearchReplaceDialog";
import MoveTo from "./MoveTo";
import CopyTo from "./CopyTo";
import Download from "./Download";
import Share from "./Share";
import Permissions from "./Permissions";
import VersionHistory from "./VersionHistory";
import Restore from "./Restore";
import DeletePermanently from "./DeletePermanently";

const FileMenu = ({ anchorEl, open, onClose, files }) => {
  const [searchReplaceOpen, setSearchReplaceOpen] = React.useState(false);
  const [moveToOpen, setMoveToOpen] = React.useState(false);
  const [copyToOpen, setCopyToOpen] = React.useState(false);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [permissionsOpen, setPermissionsOpen] = React.useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = React.useState(false);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [deletePermanentlyOpen, setDeletePermanentlyOpen] = React.useState(false);

  const handleSearchReplace = () => {
    setSearchReplaceOpen(true);
    onClose();
  };

  const handleMoveTo = () => {
    setMoveToOpen(true);
    onClose();
  };

  const handleCopyTo = () => {
    setCopyToOpen(true);
    onClose();
  };

  const handleDownload = () => {
    setDownloadOpen(true);
    onClose();
  };

  const handleShare = () => {
    setShareOpen(true);
    onClose();
  };

  const handlePermissions = () => {
    setPermissionsOpen(true);
    onClose();
  };

  const handleVersionHistory = () => {
    setVersionHistoryOpen(true);
    onClose();
  };

  const handleRestore = () => {
    setRestoreOpen(true);
    onClose();
  };

  const handleDeletePermanently = () => {
    setDeletePermanentlyOpen(true);
    onClose();
  };

  return (
    <div>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        MenuListProps={{
          "aria-labelledby": "file-menu-button",
        }}
      >
        <MenuItem onClick={handleSearchReplace}>
          <i className="fas fa-search" />
          Search and Replace
        </MenuItem>
        <MenuItem onClick={handleMoveTo}>
          <i className="fas fa-folder" />
          Move To
        </MenuItem>
        <MenuItem onClick={handleCopyTo}>
          <i className="fas fa-copy" />
          Copy To
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <i className="fas fa-download" />
          Download
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <i className="fas fa-share" />
          Share
        </MenuItem>
        <MenuItem onClick={handlePermissions}>
          <i className="fas fa-lock" />
          Permissions
        </MenuItem>
        <MenuItem onClick={handleVersionHistory}>
          <i className="fas fa-history" />
          Version History
        </MenuItem>
        <MenuItem onClick={handleRestore}>
          <i className="fas fa-undo" />
          Restore
        </MenuItem>
        <MenuItem onClick={handleDeletePermanently}>
          <i className="fas fa-trash" />
          Delete Permanently
        </MenuItem>
        <MenuItem>
          <Rename files={files} />
        </MenuItem>
        <MenuItem>
          <Edit files={files} />
        </MenuItem>
        <MenuItem>
          <Delete files={files} />
        </MenuItem>
      </Menu>
      <FileSearchReplaceDialog
        open={searchReplaceOpen}
        onClose={() => setSearchReplaceOpen(false)}
        files={files}
      />
      <MoveToDialog
        open={moveToOpen}
        onClose={() => setMoveToOpen(false)}
        files={files}
      />
      <CopyToDialog
        open={copyToOpen}
        onClose={() => setCopyToOpen(false)}
        files={files}
      />
      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        files={files}
      />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        files={files}
      />
      <PermissionsDialog
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
        files={files}
      />
      <VersionHistoryDialog
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        files={files}
      />
      <RestoreDialog
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        files={files}
      />
      <DeletePermanentlyDialog
        open={deletePermanentlyOpen}
        onClose={() => setDeletePermanentlyOpen(false)}
        files={files}
      />
    </div>
  );
};

export default FileMenu;

import Dialog from "./ui/Dialog"; // Correct path
import DialogTitle from "./ui/DialogTitle"; // Correct path
import DialogContent from "./ui/DialogContent"; // Correct path
import DialogActions from "./ui/DialogActions"; // Correct path
import Button from "./ui/Button"; // Correct path


const FileSearchReplaceDialog = ({ open, onClose, files }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Search and Replace</DialogTitle>
      <DialogContent>
        <FileSearchReplace files={files} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onClose} color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileSearchReplaceDialog;

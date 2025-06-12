// FILE: /frontend/src/components/ShareDialog.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createShareLink, inviteCollaborator, toggleLinkVisibility, expireShareLink } from "../services/shareService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { logInfo, logError } from "@/utils/logging/logging";
import "../styles/components/ShareDialog.css";

const ROLES = ["Viewer", "Editor"]; // 🔥 Only safe roles

const ShareDialog = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [collaborators, setCollaborators] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [linkVisible, setLinkVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (file?.id) {
      fetchShareLink();
    }
  }, [file?.id]);

  const fetchShareLink = async () => {
    try {
      setLoading(true);
      const response = await createShareLink(file.id);
      setShareLink(response.data?.link || "");
      setLinkVisible(response.data?.visible || false);
    } catch (err) {
      console.error("Fetch Share Link Error:", err);
      setError("Failed to fetch share link.");
    } finally {
      setLoading(false);
    }
  };
  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("🔗 Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy Error:", err);
      toast.error("Failed to copy link.");
    }
  };

  const validateEmail = (emailAddress) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  };

  const handleInviteCollaborator = async () => {
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await inviteCollaborator(file.id, email.trim(), role);
      setCollaborators([...collaborators, { email: email.trim(), role }]);
      toast.success(`✅ Invited ${email.trim()} as ${role}`);
      logInfo("CollaboratorInvited", { fileId: file.id, email, role });
      setEmail("");
      setRole("Viewer");
    } catch (err) {
      console.error("Invite Error:", err);
      toast.error(err.message || "Failed to send invitation.");
      logError(err, "InviteCollaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLinkVisibility = async () => {
    try {
      setLoading(true);
      const newVisibility = !linkVisible;
      await toggleLinkVisibility(file.id, newVisibility);
      setLinkVisible(newVisibility);
      toast.success(`🔓 Link is now ${newVisibility ? "public" : "private"}`);
      logInfo("LinkVisibilityChanged", { fileId: file.id, visible: newVisibility });
    } catch (err) {
      console.error("Toggle Visibility Error:", err);
      toast.error("Failed to change link visibility.");
      logError(err, "ToggleLinkVisibility");
    } finally {
      setLoading(false);
    }
  };

  const handleExpireLink = async () => {
    if (!window.confirm("Are you sure you want to expire this share link? It will stop working immediately.")) return;

    try {
      setLoading(true);
      await expireShareLink(file.id);
      setShareLink("");
      toast.success("🔒 Share link expired.");
      logInfo("ShareLinkExpired", { fileId: file.id });
    } catch (err) {
      console.error("Expire Link Error:", err);
      toast.error("Failed to expire link.");
      logError(err, "ExpireShareLink");
    } finally {
      setLoading(false);
    }
  };
  if (!file) return null;

  return (
    <div className="share-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="share-dialog">
        <h2 className="share-title">🔗 Share "{file.name}"</h2>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {loading && <Loader className="mb-4" />}

        <div className="share-section">
          <label htmlFor="share-link">Public Share Link</label>
          <div className="share-link-box">
            <Input
              id="share-link"
              value={shareLink || "No active link"}
              readOnly
              className="readonly-link"
            />
            <Button onClick={handleCopy} disabled={!shareLink} className="copy-button">
              {copied ? "✅ Copied!" : "Copy"}
            </Button>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <Button onClick={handleToggleLinkVisibility} className="bg-blue-500 hover:bg-blue-600 text-white">
              {linkVisible ? "Make Private" : "Make Public"}
            </Button>

            {linkVisible && (
              <Button onClick={handleExpireLink} className="bg-red-500 hover:bg-red-600 text-white">
                Expire Link
              </Button>
            )}
          </div>
        </div>

        <div className="share-section mt-8">
          <label htmlFor="collab-email" className="block mb-2">
            Invite Collaborators
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="email"
              id="collab-email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />

            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLES.map((r) => ({ value: r, label: r }))}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleInviteCollaborator}
            disabled={!email.trim()}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white"
          >
            Send Invite
          </Button>
        </div>
        {collaborators.length > 0 && (
          <div className="share-section mt-8">
            <h3 className="text-lg font-semibold mb-2">Invited Collaborators</h3>
            <ul className="collab-list space-y-2">
              {collaborators.map((c, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
                >
                  <div>
                    <p className="text-gray-800">{c.email}</p>
                    <p className="text-sm text-gray-500">Role: {c.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="share-actions mt-6">
          <Button
            className="cancel-button bg-gray-500 hover:bg-gray-600 text-white w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

ShareDialog.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default ShareDialog;

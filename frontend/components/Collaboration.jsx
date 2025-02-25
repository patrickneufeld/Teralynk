// File Path: frontend/components/Collaboration.jsx

import React, { useState, useEffect } from 'react';
import '../styles/Collaboration.css'; // Ensure the CSS file exists and is styled correctly

const Collaboration = () => {
    const [sharedFiles, setSharedFiles] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        fetchCollaborationData();
    }, []);

    const fetchCollaborationData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/collaboration');
            if (response.ok) {
                const data = await response.json();
                setSharedFiles(data.files || []);
                setComments(data.comments || []);
            } else {
                setError('Failed to load collaboration data.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setCommentLoading(true);
        setError('');
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: newComment }),
            });

            if (response.ok) {
                const comment = await response.json();
                setComments((prev) => [...prev, comment]);
                setNewComment('');
            } else {
                setError('Failed to add comment.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div className="collaboration">
            <h2>Team Collaboration</h2>
            {error && <p className="error-message">{error}</p>}

            {loading ? (
                <p className="loading-message">Loading collaboration data...</p>
            ) : (
                <>
                    {/* Shared Files Section */}
                    <div className="shared-files">
                        <h3>Shared Files</h3>
                        {sharedFiles.length === 0 ? (
                            <p>No shared files available.</p>
                        ) : (
                            <ul>
                                {sharedFiles.map((file) => (
                                    <li key={file.id}>{file.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="comments-section">
                        <h3>Comments</h3>
                        {comments.length === 0 ? (
                            <p>No comments yet. Be the first to comment!</p>
                        ) : (
                            <ul>
                                {comments.map((comment, index) => (
                                    <li key={index}>{comment.text}</li>
                                ))}
                            </ul>
                        )}
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            aria-label="Add a comment"
                        ></textarea>
                        <button
                            onClick={handleAddComment}
                            disabled={commentLoading}
                            aria-label="Post comment"
                        >
                            {commentLoading ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Collaboration;

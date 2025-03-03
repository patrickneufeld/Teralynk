// /Users/patrick/Projects/Teralynk/frontend/src/components/Collaboration.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Alert } from "../components/ui/alert";
import { Loader } from "../components/ui/loader";

const Collaboration = () => {
    const [sharedFiles, setSharedFiles] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        fetchCollaborationData();
    }, []);

    const fetchCollaborationData = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("/api/collaboration");
            setSharedFiles(response.data.files || []);
            setComments(response.data.comments || []);
        } catch (err) {
            setError("Failed to load collaboration data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            setError("Comment cannot be empty.");
            return;
        }

        setCommentLoading(true);
        setError("");
        try {
            const response = await axios.post("/api/comments", { text: newComment });
            setComments((prev) => [...prev, response.data]);
            setNewComment("");
        } catch (err) {
            setError("Failed to add comment.");
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Team Collaboration</h2>

            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}
            {loading && <Loader className="mb-4" />}

            {!loading && (
                <>
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <h3 className="text-lg font-semibold">Shared Files</h3>
                            {sharedFiles.length === 0 ? (
                                <p className="text-gray-600">No shared files available.</p>
                            ) : (
                                <ul className="list-disc pl-5">
                                    {sharedFiles.map((file) => (
                                        <li key={file.id} className="text-gray-700">
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <h3 className="text-lg font-semibold">Comments</h3>
                            {comments.length === 0 ? (
                                <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                            ) : (
                                <ul className="list-disc pl-5">
                                    {comments.map((comment) => (
                                        <li key={comment.id} className="text-gray-700">
                                            {comment.text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                aria-label="Add a comment"
                                rows={3}
                                className="mt-3 w-full"
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={commentLoading}
                                className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
                                aria-label="Post comment"
                            >
                                {commentLoading ? "Posting..." : "Post Comment"}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default Collaboration;

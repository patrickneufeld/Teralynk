// File Path: frontend/components/AdminReview.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/AdminReview.css'; // Ensure the CSS file exists

const AdminReview = () => {
    const [pendingPlatforms, setPendingPlatforms] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch pending platforms for admin review
    useEffect(() => {
        const fetchPendingPlatforms = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get('/api/admin-review/pending');
                setPendingPlatforms(response.data);
            } catch (err) {
                setError('Error fetching pending platforms.');
            } finally {
                setLoading(false);
            }
        };

        fetchPendingPlatforms();
    }, []);

    // Approve platform
    const handleApprove = async (userId, platform) => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await axios.post('/api/admin-review/approve', { userId, platform });
            setPendingPlatforms(pendingPlatforms.filter(p => p.userId !== userId));
            setSuccess(`Platform "${platform}" approved for user.`);
        } catch (err) {
            setError('Error approving platform.');
        } finally {
            setLoading(false);
        }
    };

    // Reject platform
    const handleReject = async (userId, platform) => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await axios.post('/api/admin-review/reject', { userId, platform });
            setPendingPlatforms(pendingPlatforms.filter(p => p.userId !== userId));
            setSuccess(`Platform "${platform}" rejected for user.`);
        } catch (err) {
            setError('Error rejecting platform.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-review-container">
            <h2>Admin Review</h2>
            {loading && <p className="loading-message">Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            {pendingPlatforms.length === 0 && !loading ? (
                <p>No platforms pending approval.</p>
            ) : (
                <ul className="pending-list">
                    {pendingPlatforms.map((user) => (
                        <li key={user._id} className="user-item">
                            <h3>{user.email}</h3>
                            <ul className="platform-list">
                                {Object.keys(user).map((platform) => {
                                    if (user[platform]?.adminReviewPending) {
                                        return (
                                            <li key={platform} className="platform-item">
                                                <strong>{platform}</strong>
                                                <button
                                                    onClick={() => handleApprove(user._id, platform)}
                                                    aria-label={`Approve ${platform} for ${user.email}`}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user._id, platform)}
                                                    aria-label={`Reject ${platform} for ${user.email}`}
                                                >
                                                    Reject
                                                </button>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminReview;

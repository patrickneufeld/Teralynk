import React, { useState, useEffect } from 'react';
import { getWorkflows, createWorkflow } from '../services/workflow-service';

const WorkflowPage = () => {
    const [workflows, setWorkflows] = useState([]);
    const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch workflows on mount
    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true);
                console.log('Fetching workflows...');
                const data = await getWorkflows();
                console.log('Received workflows:', data);
                if (Array.isArray(data)) {
                    setWorkflows(data);
                } else {
                    console.error('Unexpected data format:', data);
                    setError('Received invalid data format from server');
                }
            } catch (err) {
                console.error('Error details:', err);
                setError('Failed to fetch workflows: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflows();
    }, []);

    // Create a new workflow
    const handleCreateWorkflow = async () => {
        try {
            setLoading(true);
            const response = await createWorkflow(newWorkflow);
            setWorkflows((prev) => [...prev, response]);
            setNewWorkflow({ name: '', description: '' }); // Reset form
        } catch (err) {
            console.error('Create workflow error:', err);
                setError(err.message || 'Failed to create workflow.');
        } finally {
            setLoading(false);
        }
    };

    // Delete a workflow
    const handleDeleteWorkflow = async (workflowId) => {
        try {
            setLoading(true);
            await deleteWorkflow(workflowId);
            setWorkflows((prev) => prev.filter((workflow) => workflow.id !== workflowId));
        } catch (err) {
            setError('Failed to delete workflow.');
        } finally {
            setLoading(false);
        }
    };

    // Start a workflow
    const handleStartWorkflow = async (workflowId) => {
        try {
            setLoading(true);
            await startWorkflow(workflowId);
            alert('Workflow started successfully.');
        } catch (err) {
            setError('Failed to start workflow.');
        } finally {
            setLoading(false);
        }
    };

    // Stop a workflow
    const handleStopWorkflow = async (workflowId) => {
        try {
            setLoading(true);
            await stopWorkflow(workflowId);
            alert('Workflow stopped successfully.');
        } catch (err) {
            setError('Failed to stop workflow.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Workflow Management</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>Loading...</p>}

            {/* Create Workflow Form */}
            <div>
                <h2>Create New Workflow</h2>
                <input
                    type="text"
                    placeholder="Workflow Name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Workflow Description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                />
                <button onClick={handleCreateWorkflow} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Workflow'}
                </button>
            </div>

            {/* Display Existing Workflows */}
            <div>
                <h2>Existing Workflows</h2>
                <ul>
                    {workflows.map((workflow) => (
                        <li key={workflow.id}>
                            <strong>{workflow.name}</strong> - {workflow.description}
                            <button onClick={() => handleStartWorkflow(workflow.id)} disabled={loading}>
                                Start
                            </button>
                            <button onClick={() => handleStopWorkflow(workflow.id)} disabled={loading}>
                                Stop
                            </button>
                            <button onClick={() => handleDeleteWorkflow(workflow.id)} disabled={loading}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WorkflowPage;

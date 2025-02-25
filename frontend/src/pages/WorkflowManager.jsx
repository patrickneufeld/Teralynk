// File Path: frontend/src/components/WorkflowManager.js
import React, { useState, useEffect } from 'react';
import {
    getWorkflows,
    getWorkflowDetails,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    startWorkflow,
    stopWorkflow,
} from '../api/workflow';

const WorkflowManager = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch all workflows on component mount
    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true);
                const data = await getWorkflows();
                setWorkflows(data);
            } catch (err) {
                setError('Failed to fetch workflows.');
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
            const data = await createWorkflow(newWorkflow);
            setWorkflows((prev) => [...prev, data]);
            setNewWorkflow({ name: '', description: '' }); // Reset form
        } catch (err) {
            setError('Failed to create workflow.');
        } finally {
            setLoading(false);
        }
    };

    // View workflow details
    const handleViewWorkflow = async (workflowId) => {
        try {
            setLoading(true);
            const data = await getWorkflowDetails(workflowId);
            setSelectedWorkflow(data);
        } catch (err) {
            setError('Failed to fetch workflow details.');
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
            <h1>Workflow Manager</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>Loading...</p>}

            {/* Workflow List */}
            <div>
                <h2>Workflows</h2>
                <ul>
                    {workflows.map((workflow) => (
                        <li key={workflow.id}>
                            <span>{workflow.name}</span>
                            <button onClick={() => handleViewWorkflow(workflow.id)}>View</button>
                            <button onClick={() => handleStartWorkflow(workflow.id)}>Start</button>
                            <button onClick={() => handleStopWorkflow(workflow.id)}>Stop</button>
                            <button onClick={() => handleDeleteWorkflow(workflow.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Create Workflow */}
            <div>
                <h2>Create Workflow</h2>
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
                <button onClick={handleCreateWorkflow}>Create</button>
            </div>

            {/* Workflow Details */}
            {selectedWorkflow && (
                <div>
                    <h2>Workflow Details</h2>
                    <p>Name: {selectedWorkflow.name}</p>
                    <p>Description: {selectedWorkflow.description}</p>
                </div>
            )}
        </div>
    );
};

export default WorkflowManager;

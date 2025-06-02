// File Path: frontend/src/components/WorkflowForm.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/WorkflowForm.css'; // Ensure this file exists in the styles folder

function WorkflowForm({ onSubmit, initialData, onCancel }) {
    const [workflowName, setWorkflowName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [trigger, setTrigger] = useState(initialData?.trigger || '');
    const [actions, setActions] = useState(initialData?.actions || ['']);

    const handleActionChange = (index, value) => {
        const updatedActions = [...actions];
        updatedActions[index] = value;
        setActions(updatedActions);
    };

    const handleAddAction = () => {
        setActions([...actions, '']);
    };

    const handleRemoveAction = (index) => {
        const updatedActions = actions.filter((_, i) => i !== index);
        setActions(updatedActions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name: workflowName, description, trigger, actions });
    };

    return (
        <div className="workflow-form">
            <h2>{initialData ? 'Edit Workflow' : 'Create Workflow'}</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Workflow Name:
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Description:
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Trigger:
                    <input
                        type="text"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Actions:
                    {actions.map((action, index) => (
                        <div key={index} className="action-item">
                            <input
                                type="text"
                                value={action}
                                onChange={(e) => handleActionChange(index, e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => handleRemoveAction(index)}>
                                Remove
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddAction}>
                        Add Action
                    </button>
                </label>
                <div className="form-actions">
                    <button type="submit">{initialData ? 'Update Workflow' : 'Create Workflow'}</button>
                    {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
                </div>
            </form>
        </div>
    );
}

WorkflowForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialData: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        trigger: PropTypes.string,
        actions: PropTypes.arrayOf(PropTypes.string),
    }),
    onCancel: PropTypes.func,
};

export default WorkflowForm;

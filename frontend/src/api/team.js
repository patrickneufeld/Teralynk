import apiClient from './apiClient';

// Get all team members
export const getTeamMembers = async () => {
    const response = await apiClient.get('/team');
    return response.data;
};

// Add a new team member
export const addTeamMember = async (email, role) => {
    const response = await apiClient.post('/team', { email, role });
    return response.data;
};

// Update team member role
export const updateTeamMemberRole = async (memberId, role) => {
    const response = await apiClient.put(`/team/${memberId}`, { role });
    return response.data;
};

// Remove a team member
export const removeTeamMember = async (memberId) => {
    const response = await apiClient.delete(`/team/${memberId}`);
    return response.data;
};

// Get a specific team member by ID
export const getTeamMemberById = async (memberId) => {
    const response = await apiClient.get(`/team/${memberId}`);
    return response.data;
};

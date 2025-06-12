// File: /backend/src/ai/aiPersonaLibrary.js

/**
 * Static reference of supported AI personas and their classification types.
 * This file is the centralized truth for what types of personas the system supports out-of-the-box.
 * New personas learned through history or metadata analysis are appended dynamically elsewhere.
 */

export const AIPersonaLibrary = {
  education: [
    'grade_school_student',
    'high_school_student',
    'college_student',
    'university_student',
    'professor',
    'researcher',
    'academic_advisor',
    'teaching_assistant',
  ],
  professional: [
    'developer',
    'engineer',
    'data_scientist',
    'security_analyst',
    'sysadmin',
    'cloud_engineer',
    'mechanic',
    'consultant',
    'product_manager',
    'project_manager',
    'financial_analyst',
    'lawyer',
    'accountant',
    'realtor',
    'sales_rep',
    'hr_manager',
    'marketer',
    'ux_researcher',
    'event_planner',
    'architect',
  ],
  creative: [
    'photographer',
    'designer',
    'blogger',
    'artist',
    'filmmaker',
    'writer',
    'editor',
    'animator',
    'musician',
  ],
  infrastructure: [
    'construction_worker',
    'chef',
    'logistics_manager',
    'warehouse_operator',
    'electrician',
  ],
  meta: [
    'unknown',
    'custom',
    'hybrid',
    'multi_role',
  ],
};

/**
 * Checks if a persona exists.
 * @param {string} persona
 * @returns {boolean}
 */
export function isKnownPersona(persona) {
  return Object.values(AIPersonaLibrary).flat().includes(persona);
}

/**
 * Returns a flat list of all known personas.
 * @returns {string[]}
 */
export function getAllPersonas() {
  return Object.values(AIPersonaLibrary).flat();
}

/**
 * ✅ Export as default for safer import elsewhere
 */
export default {
  AIPersonaLibrary,
  isKnownPersona,
  getAllPersonas,
};

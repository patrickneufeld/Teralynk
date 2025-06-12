import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiNamingTemplateEngine.js

import path from 'path';
import crypto from 'crypto';

const personaTemplates = {
  // EDUCATION
  'grade_school_student': ['Homework_{subject}_{date}', 'ClassNotes_{grade}_{topic}'],
  'high_school_student': ['Assignment_{course}_{topic}_{date}', 'Notes_{subject}_{date}'],
  'college_student': ['Essay_{course}_{title}_{version}', 'LectureNotes_{professor}_{topic}'],
  'university_student': ['Research_{topic}_{semester}_{version}', 'Project_{group}_{topic}_{deadline}'],
  'professor': ['Lecture_{course}_{topic}_{date}', 'Syllabus_{semester}_{course}'],

  // PROFESSIONAL
  'developer': ['module_{feature}_{env}_{version}', 'test_{feature}_{timestamp}'],
  'photographer': ['IMG_{location}_{camera}_{timestamp}', 'Shoot_{client}_{date}_{type}'],
  'designer': ['Design_{project}_{version}', 'Mockup_{screen}_{platform}_{version}'],
  'marketer': ['Campaign_{client}_{platform}_{date}', 'Ad_{medium}_{goal}_{timestamp}'],
  'lawyer': ['Case_{client}_{matter}_{filingDate}', 'Contract_{party}_{type}_{version}'],
  'accountant': ['Invoice_{client}_{period}', 'Ledger_{year}_{quarter}_{account}'],
  'realtor': ['Listing_{address}_{MLS}_{date}', 'Client_{name}_{property}_{status}'],
  'musician': ['Track_{album}_{bpm}_{instrument}', 'Mix_{project}_{version}_{date}'],
  'engineer': ['Blueprint_{project}_{part}_{revision}', 'Calc_{scenario}_{factor}_{timestamp}'],
  'data_scientist': ['Model_{type}_{version}_{dataset}', 'Report_{insight}_{date}'],

  // CREATIVE
  'blogger': ['Post_{topic}_{slug}_{date}', 'Draft_{title}_{round}'],
  'artist': ['Sketch_{theme}_{medium}_{iteration}', 'Final_{piece}_{year}'],
  'filmmaker': ['Scene_{project}_{shot}_{take}', 'Edit_{film}_{track}_{version}'],
  'writer': ['Manuscript_{title}_{chapter}_{revision}', 'Outline_{story}_{arc}'],
  'architect': ['Design_{building}_{type}_{phase}', 'Permit_{zone}_{city}_{year}'],
  'editor': ['Edit_{project}_{section}_{round}', 'Proof_{doc}_{changeset}'],
  'UX_researcher': ['Study_{feature}_{method}_{date}', 'Persona_{segment}_{version}'],
  'animator': ['Frame_{scene}_{char}_{frameNumber}', 'Render_{project}_{layer}_{version}'],

  // TECHNICAL OPS
  'sysadmin': ['Backup_{server}_{env}_{timestamp}', 'Log_{system}_{alert}_{date}'],
  'cloud_engineer': ['Infra_{service}_{region}_{version}', 'Terraform_{module}_{env}'],
  'security_analyst': ['VulnReport_{system}_{cve}_{date}', 'Audit_{compliance}_{period}'],

  // BUSINESS + OTHER
  'chef': ['Recipe_{dish}_{revision}', 'Menu_{season}_{venue}'],
  'construction_worker': ['Plan_{site}_{task}_{shift}', 'Inspection_{date}_{area}'],
  'mechanic': ['Repair_{vehicle}_{issue}_{date}', 'Log_{maintenance}_{mileage}'],
  'financial_analyst': ['Forecast_{market}_{quarter}', 'Report_{investment}_{date}'],
  'sales_rep': ['Pitch_{client}_{product}_{date}', 'Deal_{stage}_{name}_{region}'],
  'consultant': ['Proposal_{client}_{phase}', 'Strategy_{market}_{scope}_{version}'],
  'HR_manager': ['Employee_{name}_{docType}_{date}', 'Policy_{dept}_{revision}'],
  'event_planner': ['Agenda_{event}_{venue}_{date}', 'Checklist_{milestone}_{date}'],
  'product_manager': ['Spec_{feature}_{sprint}_{version}', 'Roadmap_{quarter}_{team}'],

  // AI Learning Bucket
  '_custom': []
};

function suggestFilename(persona, context = {}) {
  const templates = personaTemplates[persona] || personaTemplates['_custom'];
  if (!templates.length) return `file_${Date.now()}`;

  const now = new Date();
  const token = {
    timestamp: now.toISOString().replace(/[:.]/g, '-'),
    date: now.toISOString().split('T')[0],
    version: `v${Math.floor(Math.random() * 5) + 1}`,
    hash: crypto.randomBytes(3).toString('hex'),
    ...context
  };

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/{(\w+)}/g, (_, key) => token[key] || `missing_${key}`);
}

function addPersonaTemplate(persona, template) {
  if (!personaTemplates[persona]) {
    personaTemplates[persona] = [];
  }
  if (!personaTemplates[persona].includes(template)) {
    personaTemplates[persona].push(template);
  }
}

function learnFromUserFiles(persona, filenames = []) {
  const patternCounts = {};
  filenames.forEach(name => {
    const base = path.basename(name).replace(/[^a-zA-Z0-9_{}-]/g, '_');
    patternCounts[base] = (patternCounts[base] || 0) + 1;
  });

  const top = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);

  top.forEach(pattern => addPersonaTemplate(persona, pattern));
}

function registerNewPersona(personaKey, sampleTemplates = []) {
  if (!personaTemplates[personaKey]) {
    personaTemplates[personaKey] = sampleTemplates.length ? sampleTemplates : ['File_{type}_{timestamp}'];
  }
}

function getAllPersonas() {
  return Object.keys(personaTemplates);
}

function getTemplatesForPersona(persona) {
  return personaTemplates[persona] || [];
}

export {
  suggestFilename,
  addPersonaTemplate,
  learnFromUserFiles,
  registerNewPersona,
  getAllPersonas,
  getTemplatesForPersona
};

// File Path: frontend/src/components/BusinessProposal.jsx

import React, { useState } from 'react';
import axios from 'axios';

const BusinessProposal = () => {
  const [template, setTemplate] = useState('');
  const [keywords, setKeywords] = useState({});
  const [generatedProposal, setGeneratedProposal] = useState('');

  const handleGenerateProposal = async () => {
    try {
      const response = await axios.post('/api/ai/generateProposal', { template, keywords }, {
        withCredentials: true,
      });
      setGeneratedProposal(response.data.proposal);
    } catch (error) {
      console.error('Error generating proposal:', error);
    }
  };

  return (
    <div className="business-proposal">
      <h2>Generate Business Proposal</h2>
      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder="Enter business proposal template here..."
      />
      <div>
        <label>Keywords: </label>
        <input
          type="text"
          onChange={(e) => setKeywords({ ...keywords, keyword: e.target.value })}
        />
      </div>
      <button onClick={handleGenerateProposal}>Generate Proposal</button>

      {generatedProposal && <div className="generated-proposal">{generatedProposal}</div>}
    </div>
  );
};

export default BusinessProposal;

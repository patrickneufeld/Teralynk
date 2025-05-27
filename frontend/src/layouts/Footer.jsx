// ✅ FILE: /frontend/src/components/layout/Footer.jsx

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

// 🎨 Styled components using logo-inspired colors
const FooterContainer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb; /* Tailwind gray-200 */
  width: 100%;
  position: relative;
  bottom: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FooterText = styled.span`
  color: #6b7280; /* Tailwind gray-500 */
  font-size: 0.875rem;
`;

const FooterLink = styled.a`
  color: #1e3a8a; /* Tailwind blue-800 / Teralynk brand */
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    color: #0f172a; /* Tailwind slate-900 / deeper accent */
  }
`;

const Footer = ({
  companyName = 'Teralynk',
  year = new Date().getFullYear(),
  links = [],
  version,
  showVersion = true,
  className = '',
}) => {
  const appVersion =
    version || import.meta?.env?.VITE_APP_VERSION || '1.0.0';

  const safeLinks = Array.isArray(links)
    ? links.filter((link) => link && link.label && link.href)
    : [];

  return (
    <FooterContainer className={className} data-testid="footer">
      {/* © Info */}
      <FooterSection>
        <FooterText>
          © {year} {companyName}. All rights reserved.
        </FooterText>
      </FooterSection>

      {/* Dynamic Links */}
      {safeLinks.length > 0 && (
        <FooterSection>
          {safeLinks.map((link, index) => (
            <React.Fragment key={link.id || index}>
              <FooterLink
                href={link.href}
                target={link.external ? '_blank' : '_self'}
                rel={link.external ? 'noopener noreferrer' : undefined}
                aria-label={link.label}
                data-testid={`footer-link-${index}`}
              >
                {link.label}
              </FooterLink>
              {index < safeLinks.length - 1 && <FooterText>•</FooterText>}
            </React.Fragment>
          ))}
        </FooterSection>
      )}

      {/* App Version */}
      {showVersion && (
        <FooterSection>
          <FooterText data-testid="footer-version">v{appVersion}</FooterText>
        </FooterSection>
      )}
    </FooterContainer>
  );
};

Footer.propTypes = {
  companyName: PropTypes.string,
  year: PropTypes.number,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      external: PropTypes.bool,
    })
  ),
  version: PropTypes.string,
  showVersion: PropTypes.bool,
  className: PropTypes.string,
};

export default Footer;

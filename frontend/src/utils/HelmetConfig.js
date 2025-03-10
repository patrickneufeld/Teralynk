// ✅ FILE: /src/utils/HelmetConfig.js

import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";

/**
 * HelmetConfig Component: Dynamically inject SEO metadata into the head tag.
 * @param {string} title - The title of the page.
 * @param {string} description - The meta description for the page.
 * @param {string} url - The canonical URL for the page.
 * @param {string} image - Open Graph image for social sharing.
 * @param {string} type - Open Graph type (e.g., "website", "article").
 * @returns {React.Component} React Helmet configuration for SEO and Open Graph tags.
 */
const HelmetConfig = ({
  title = "Default Title",
  description = "Default description for the Teralynk application.",
  url = window.location.href,
  image = "/default-og-image.png", // Update with your default image path
  type = "website",
}) => {
  return (
    <Helmet>
      {/* Primary SEO Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph / Social Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

HelmetConfig.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  url: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
};

export default HelmetConfig;

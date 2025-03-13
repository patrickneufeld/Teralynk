// ✅ FILE: /frontend/src/utils/HelmetConfig.js

import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";

/**
 * HelmetConfig Component: Dynamically inject SEO metadata into the head tag.
 *
 * @param {Object} props
 * @param {string} props.title - Page title.
 * @param {string} props.description - Meta description.
 * @param {string} props.url - Canonical URL.
 * @param {string} props.image - Open Graph image URL.
 * @param {string} props.type - Open Graph type.
 */
const HelmetConfig = ({
  title = "Default Title",
  description = "Default description for the Teralynk application.",
  url = typeof window !== "undefined" ? window.location.href : "https://teralynk.com",
  image = "/default-og-image.png",
  type = "website",
}) => {
  const validUrl = (() => {
    try {
      return new URL(url).href;
    } catch (err) {
      console.warn("⚠️ Invalid URL passed to HelmetConfig. Using fallback.");
      return "https://teralynk.com";
    }
  })();

  return (
    <Helmet>
      {/* Primary SEO Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph / Social Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={validUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={validUrl} />
    </Helmet>
  );
};

HelmetConfig.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  url: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.oneOf(["website", "article", "product", "video.other"]),
};

export default HelmetConfig;

//Users/patrick/Projects/Teralynk/frontend/src/components/FileIcon.jsx
import React from 'react';
import {
  FaFile,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileVideo,
  FaFileCode,
  FaFileArchive,
  FaFileAlt,
  FaFolder
} from 'react-icons/fa';

/**
 * FileIcon component that displays an appropriate icon based on file type
 * @param {Object} props - Component props
 * @param {string} props.filename - The filename to determine icon from
 * @param {boolean} props.isFolder - Whether the item is a folder
 * @param {string} props.size - Icon size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 */
const FileIcon = ({ filename, isFolder, size = 'md', className = '' }) => {
  // If it's a folder, return folder icon
  if (isFolder) {
    return <FaFolder className={`text-yellow-500 ${getSizeClass(size)} ${className}`} />;
  }

  // Get file extension
  const extension = filename ? filename.split('.').pop().toLowerCase() : '';
  
  // Determine icon based on file extension
  const IconComponent = getIconByExtension(extension);
  
  // Determine color based on file type
  const colorClass = getColorByExtension(extension);
  
  return <IconComponent className={`${colorClass} ${getSizeClass(size)} ${className}`} />;
};

/**
 * Get the appropriate icon component based on file extension
 * @param {string} extension - File extension
 * @returns {React.ComponentType} Icon component
 */
const getIconByExtension = (extension) => {
  switch (extension) {
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return FaFileImage;
    
    // Documents
    case 'pdf':
      return FaFilePdf;
    case 'doc':
    case 'docx':
      return FaFileWord;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return FaFileExcel;
    case 'ppt':
    case 'pptx':
      return FaFilePowerpoint;
    case 'txt':
    case 'rtf':
    case 'md':
      return FaFileAlt;
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'm4a':
    case 'flac':
      return FaFileAudio;
    
    // Video
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'mkv':
    case 'webm':
      return FaFileVideo;
    
    // Code
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'json':
    case 'xml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
      return FaFileCode;
    
    // Archives
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return FaFileArchive;
    
    // Default
    default:
      return FaFile;
  }
};

/**
 * Get the appropriate color class based on file extension
 * @param {string} extension - File extension
 * @returns {string} Tailwind CSS color class
 */
const getColorByExtension = (extension) => {
  switch (extension) {
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return 'text-green-500';
    
    // Documents
    case 'pdf':
      return 'text-red-500';
    case 'doc':
    case 'docx':
      return 'text-blue-600';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'text-green-600';
    case 'ppt':
    case 'pptx':
      return 'text-orange-500';
    case 'txt':
    case 'rtf':
    case 'md':
      return 'text-gray-600';
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'm4a':
    case 'flac':
      return 'text-purple-500';
    
    // Video
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'mkv':
    case 'webm':
      return 'text-pink-500';
    
    // Code
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'json':
    case 'xml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
      return 'text-indigo-500';
    
    // Archives
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return 'text-yellow-600';
    
    // Default
    default:
      return 'text-gray-500';
  }
};

/**
 * Get the appropriate size class based on size prop
 * @param {string} size - Size (sm, md, lg)
 * @returns {string} Tailwind CSS size class
 */
const getSizeClass = (size) => {
  switch (size) {
    case 'sm':
      return 'text-lg';
    case 'md':
      return 'text-xl';
    case 'lg':
      return 'text-2xl';
    case 'xl':
      return 'text-3xl';
    default:
      return 'text-xl';
  }
};

export default FileIcon;

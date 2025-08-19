import React from 'react';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <h2 className="text-lg font-normal text-gray-800 mb-4">
      {title}
    </h2>
  );
};

export default SectionHeader;
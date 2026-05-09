"use client";

import * as Ri from "react-icons/ri"; // Remix icons
import { ReactNode } from "react";

// Map of prefixes to icon packages
const iconPackages: { [key: string]: any } = {
  Ri,
};

export default function Icon({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  function getIcon(name: string): ReactNode {
    // Extract prefix (first two characters)
    const prefix = name.slice(0, 2);

    // Get the corresponding icon package
    const iconPackage = iconPackages[prefix];
    if (iconPackage) {
      const iconName = name as keyof typeof iconPackage;
      return iconPackage[iconName] || null;
    }

    return null;
  }

  const IconComponent = getIcon(name) as React.ElementType;

  // Return null if no icon is found
  if (!IconComponent) return null;

  // Render the icon component instead of returning it directly
  return (
    <IconComponent
      className={`${className} cursor-pointer`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}

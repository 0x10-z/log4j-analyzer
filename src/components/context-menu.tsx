import React, { useEffect, useRef, useState } from "react";

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  options: { label: React.ReactNode; action: () => void }[]; // Allow JSX in label
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  position,
  options,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{
    top: number;
    left: number;
  }>({ top: position.y, left: position.x });

  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const calculatedPosition = {
        top:
          position.y + menu.height > viewportHeight
            ? Math.max(position.y - menu.height, 0)
            : position.y,
        left:
          position.x + menu.width > viewportWidth
            ? Math.max(position.x - menu.width, 0)
            : position.x,
      };

      setAdjustedPosition(calculatedPosition);
    }
  }, [visible, position]);

  useEffect(() => {
    if (visible) {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      window.addEventListener("mousedown", handleClickOutside);
      return () => {
        window.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 shadow-lg rounded z-50"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            option.action();
            onClose();
          }}
          className="block w-full text-left px-4 py-2 hover:bg-blue-100 focus:outline-none cursor-pointer"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

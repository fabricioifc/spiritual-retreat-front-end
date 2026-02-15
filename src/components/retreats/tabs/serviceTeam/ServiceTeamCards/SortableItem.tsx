"use client";

import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/react/sortable";

import { Item } from "@/src/components/dnd-kit/components";

type UniqueIdentifier = string | number;

interface SortableItemProps {
  id: UniqueIdentifier;
  value: string;
  index: number;
  handle: boolean;
  disabled?: boolean;
  group: UniqueIdentifier;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
  getColor: (id: UniqueIdentifier) => string | undefined;
}

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}

const SortableItem = React.memo(function SortableItem({
  disabled,
  id,
  index,
  handle,
  value,
  wrapperStyle,
  group,
  getColor,
}: SortableItemProps) {
  const { ref, handleRef, isDragging, isDragSource } = useSortable({
    id,
    index,
    group,
    disabled,
  });

  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Item
      ref={disabled ? undefined : ref}
      value={value}
      dragging={isDragging}
      sorting={isDragSource}
      handle={handle}
      handleProps={handle && !disabled ? { ref: handleRef } : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      color={getColor(id)}
      fadeIn={mountedWhileDragging}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : undefined,
      }}
    />
  );
}, areSortableItemPropsEqual);

function areSortableItemPropsEqual(
  prev: SortableItemProps,
  next: SortableItemProps
) {
  return (
    prev.id === next.id &&
    prev.value === next.value &&
    prev.index === next.index &&
    prev.handle === next.handle &&
    prev.disabled === next.disabled &&
    prev.group === next.group &&
    prev.wrapperStyle === next.wrapperStyle &&
    prev.getColor === next.getColor
  );
}

export default SortableItem;

import React, { useEffect, useState } from 'react';

import { useSortable } from '@dnd-kit/react/sortable';

import { Item } from '@/src/components/dnd-kit/components';

import { UniqueIdentifier } from '../types';

interface SortableItemProps {
  id: UniqueIdentifier;
  value: string;
  index: number;
  handle: boolean;
  disabled?: boolean;
  group: UniqueIdentifier;
  getColor: (id: UniqueIdentifier) => string | undefined;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
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
        cursor: disabled ? 'not-allowed' : undefined,
      }}
    />
  );
});

export default SortableItem;

import React from 'react';

import { useSortable } from '@dnd-kit/react/sortable';

import {
  Container,
  ContainerProps,
} from '@/src/components/dnd-kit/components';

import { UniqueIdentifier } from '../types';

type DroppableContainerProps = ContainerProps & {
  disabled?: boolean;
  id: UniqueIdentifier;
  index: number;
  items: UniqueIdentifier[];
  style?: React.CSSProperties;
  isSourceContainer?: boolean;
  isTargetContainer?: boolean;
};

export default function DroppableContainer({
  children,
  columns = 1,
  disabled,
  id,
  index: containerIndex,
  items,
  style,
  color,
  isSourceContainer,
  isTargetContainer,
  ...props
}: DroppableContainerProps) {
  const { ref, isDragging, isDropTarget } = useSortable({
    id,
    index: containerIndex,
    data: {
      type: 'container',
      children: items,
    },
    disabled,
  });

  return (
    <Container
      ref={disabled ? undefined : ref}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={Boolean(isTargetContainer || isSourceContainer) || isDropTarget}
      handleProps={{}}
      columns={columns}
      color={color}
      {...props}
    >
      {children}
    </Container>
  );
}

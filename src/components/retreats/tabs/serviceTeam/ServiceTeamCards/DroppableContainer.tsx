"use client";

import React from "react";
import { useSortable } from "@dnd-kit/react/sortable";

import { Container, ContainerProps } from "@/src/components/dnd-kit/components";

type UniqueIdentifier = string | number;

type DroppableContainerProps = ContainerProps & {
  disabled?: boolean;
  id: UniqueIdentifier;
  index: number;
  items: UniqueIdentifier[];
  style?: React.CSSProperties;
  isSourceContainer?: boolean;
  isTargetContainer?: boolean;
  isEmpty?: boolean;
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
  isEmpty,
  ...props
}: DroppableContainerProps) {
  const { ref, isDragging, isDropTarget } = useSortable({
    id,
    index: containerIndex,
    data: {
      type: "container",
      children: items,
    },
    disabled,
  });

  const isEmptyDropTarget =
    Boolean(isEmpty) && Boolean(isTargetContainer || isDropTarget);

  return (
    <Container
      ref={disabled ? undefined : ref}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : undefined,
        transition: "opacity 160ms ease, box-shadow 200ms ease, transform 200ms ease",
        transform: isEmptyDropTarget ? "translateY(-2px)" : undefined,
        boxShadow: isEmptyDropTarget
          ? "0 0 0 2px rgba(255, 167, 38, 0.5)"
          : undefined,
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

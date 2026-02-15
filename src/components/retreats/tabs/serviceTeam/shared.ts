import { Items, MemberToContainer } from "./types";
import { unstable_batchedUpdates } from "react-dom";

type UniqueIdentifier = string | number;

const arrayMove = <T>(array: T[], from: number, to: number): T[] => {
  const next = array.slice();
  if (from < 0 || from >= next.length || next.length === 0) {
    return next;
  }
  const clampedTo = Math.max(0, Math.min(to, next.length - 1));
  if (from === clampedTo) return next;
  const [item] = next.splice(from, 1);
  next.splice(clampedTo, 0, item);
  return next;
};

export const TRASH_ID = "void";
export const PLACEHOLDER_ID = "placeholder";

interface onDragOverProps {
  source: { id: UniqueIdentifier };
  target: { id: UniqueIdentifier } | null;
  items: Items;
  setItems: React.Dispatch<React.SetStateAction<Items>>;
  recentlyMovedToNewContainer: React.RefObject<boolean>;
  memberToContainer: MemberToContainer;
  setMemberToContainer: React.Dispatch<React.SetStateAction<MemberToContainer>>;
  isBelowOverItem?: boolean;
}

type onDragEndProps = Omit<onDragOverProps, "recentlyMovedToNewContainer"> & {
  setActiveId: React.Dispatch<React.SetStateAction<UniqueIdentifier | null>>;
  setContainers: React.Dispatch<React.SetStateAction<UniqueIdentifier[]>>;
  getNextContainerId: () => UniqueIdentifier;
  activeId: UniqueIdentifier | null;
};

export function onDragOver({
  source,
  target,
  items,
  setItems,
  recentlyMovedToNewContainer,
  memberToContainer,
  setMemberToContainer,
  isBelowOverItem = false,
}: onDragOverProps) {
  const overId = target?.id;

  if (overId == null || overId === TRASH_ID || source.id in items) {
    return;
  }

  const overContainer = findContainer(overId, items, memberToContainer);
  const activeContainer = findContainer(source.id, items, memberToContainer);

  if (!overContainer || !activeContainer) {
    return;
  }

  setItems((prev) => {
    const activeList = prev[activeContainer];
    const overList = prev[overContainer];
    const activeIndex = activeList.indexOf(source.id);
    if (activeIndex < 0) return prev;

    if (activeContainer === overContainer) {
      if (overId in prev) return prev;
      const overIndex = activeList.indexOf(overId);
      if (overIndex < 0) return prev;

      const modifier = isBelowOverItem ? 1 : 0;
      const nextIndex = Math.max(
        0,
        Math.min(overIndex + modifier, activeList.length - 1)
      );
      if (nextIndex === activeIndex) return prev;

      return {
        ...prev,
        [activeContainer]: arrayMove(activeList, activeIndex, nextIndex),
      };
    }

    const overIndex = overList.indexOf(overId);
    let newIndex: number;

    if (overId in prev) {
      newIndex = overList.length;
    } else {
      const modifier = isBelowOverItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overList.length;
    }

    const movingId = activeList[activeIndex];
    const next: Items = {
      ...prev,
      [activeContainer]: activeList.filter((id) => id !== movingId),
      [overContainer]: [
        ...overList.slice(0, newIndex),
        movingId,
        ...overList.slice(newIndex),
      ],
    };
    recentlyMovedToNewContainer.current = true;
    // Atualiza mapa O(1)
    setMemberToContainer((m) => ({ ...m, [movingId]: overContainer }));
    return next;
  });
}

export function onDragEnd({
  source,
  target,
  items,
  activeId,
  setItems,
  setActiveId,
  setContainers,
  getNextContainerId,
  memberToContainer,
  setMemberToContainer,
}: onDragEndProps) {
  if (source.id in items && target?.id) {
    setContainers((containers) => {
      const activeIndex = containers.indexOf(source.id);
      const overIndex = containers.indexOf(target.id);
      return arrayMove(containers, activeIndex, overIndex);
    });
  }

  const activeContainer = findContainer(source.id, items, memberToContainer);
  if (!activeContainer) {
    setActiveId(null);
    return;
  }

  const overId = target?.id;
  if (overId == null) {
    setActiveId(null);
    return;
  }

  if (overId === TRASH_ID) {
    setItems((prev) => ({
      ...prev,
      [activeContainer]: prev[activeContainer].filter((id) => id !== activeId),
    }));
    if (activeId) {
      setMemberToContainer((m) => {
        const clone = { ...m };
        delete clone[activeId];
        return clone;
      });
    }
    setActiveId(null);
    return;
  }

  if (overId === PLACEHOLDER_ID) {
    const newContainerId = getNextContainerId();
    unstable_batchedUpdates(() => {
      setContainers((c) => [...c, newContainerId]);
      setItems((prev) => {
        const activeList = prev[activeContainer];
        const idx = activeList.findIndex((id) => id === source.id);
        const movingId = activeList[idx];
        return {
          ...prev,
          [activeContainer]: activeList.filter((id) => id !== movingId),
          [newContainerId]: movingId ? [movingId] : [],
        };
      });
      setMemberToContainer((m) =>
        source.id ? { ...m, [source.id]: newContainerId } : m
      );
      setActiveId(null);
    });
    return;
  }

  const overContainer = findContainer(overId, items, memberToContainer);
  if (overContainer) {
    const activeIndex = items[activeContainer].indexOf(source.id);
    const overIndex = items[overContainer].indexOf(overId);
    const targetIndex =
      overId in items
        ? items[overContainer].length
        : overIndex >= 0
          ? overIndex
          : items[overContainer].length;

    if (activeContainer === overContainer) {
      if (activeIndex !== targetIndex) {
        setItems((prev) => ({
          ...prev,
          [overContainer]: arrayMove(
            prev[overContainer],
            activeIndex,
            targetIndex
          ),
        }));
      }
      setActiveId(null);
      return;
    }

    setItems((prev) => {
      const sourceList = prev[activeContainer];
      const targetList = prev[overContainer];
      const sourceIndex = sourceList.indexOf(source.id);

      if (sourceIndex < 0) {
        return prev;
      }

      const nextSource = sourceList.filter((id) => id !== source.id);
      const nextTargetBase = targetList.filter((id) => id !== source.id);
      const insertAt = Math.max(0, Math.min(targetIndex, nextTargetBase.length));
      const nextTarget = [
        ...nextTargetBase.slice(0, insertAt),
        source.id,
        ...nextTargetBase.slice(insertAt),
      ];

      return {
        ...prev,
        [activeContainer]: nextSource,
        [overContainer]: nextTarget,
      };
    });

    setMemberToContainer((m) => ({ ...m, [source.id]: overContainer }));
  }
  setActiveId(null);
}

export const findContainer = (
  id: UniqueIdentifier,
  items: Items,
  memberToContainer?: MemberToContainer
) => {
  if (id in items) return id;
  if (memberToContainer && memberToContainer[id]) return memberToContainer[id];
  return Object.keys(items).find((key) => items[key].includes(id));
};

/**
 * Converte dados da API (ServiceSpaceApiResponse) para o formato interno (ServiceSpace)
 */
export const transformApiServiceSpace = (
  apiSpace: ServiceSpaceLite,
  retreatId: string
): ServiceSpace => {
  return {
    spaceId: apiSpace.spaceId,
    retreatId,
    name: apiSpace.name,
    description: apiSpace.description || "",
    color: "#666666", // Cor padrão, pode ser gerada baseada no nome
    minMembers: apiSpace.minPeople,
    maxMembers: apiSpace.maxPeople,
    minMember: apiSpace.minPeople,
    coordinator: null,
    viceCoordinator: null,
    members: apiSpace.members,
    createdAt: undefined,
    updatedAt: undefined,
    isLocked: apiSpace.isLocked,
  };
};

import { ref, watch, type Ref } from 'vue';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';

// Wires @formkit/drag-and-drop to a list of stable string ids that mirror
// order state kept elsewhere (the Pinia editor store). The library owns a
// reactive ref of ids for rendering and pointer drag; we sync it one-way from
// the source of truth whenever the source changes, guarded so an in-flight
// drag isn't overwritten mid-gesture.
//
// The caller is responsible for turning the final ids order into a store
// mutation via `commit` (fired on `onDragend` iff the order changed).
//
// A companion `moveByKeyboard(id, direction)` returns the destination index
// after moving `id` up or down by one and commits immediately. Callers use
// this to expose an ArrowUp/ArrowDown affordance on a drag handle so the
// list is fully operable without a pointer.
export function useReorderableList(options: {
  source: () => string[];
  commit: (newOrder: string[]) => void;
}) {
  const isDragging = ref(false);
  let startSnapshot: string[] = [];

  const [parentRef, ids] = useDragAndDrop<string>(options.source(), {
    // The library relies on the DOM matching the values ref on drop. We
    // deliberately don't touch the store during the drag; the commit happens
    // in `onDragend` so a gesture that ends where it started is a no-op.
    onDragstart: () => {
      isDragging.value = true;
      startSnapshot = [...ids.value];
    },
    onDragend: () => {
      isDragging.value = false;
      const before = startSnapshot;
      const after = ids.value;
      const changed =
        before.length !== after.length || before.some((id, i) => id !== after[i]);
      if (changed) {
        options.commit([...after]);
      }
    },
  });

  // One-way sync: whenever the source list of ids changes for any reason
  // that ISN'T an in-flight drag (add/delete/undo/redo/keyboard move), copy
  // the new order into the library's ref so the render stays in step.
  watch(
    options.source,
    (next) => {
      if (isDragging.value) return;
      const current = ids.value;
      const same =
        current.length === next.length && current.every((id, i) => id === next[i]);
      if (same) return;
      ids.value = [...next];
    },
    { flush: 'post' },
  );

  function moveByKeyboard(id: string, direction: -1 | 1): number | null {
    const current = options.source();
    const from = current.indexOf(id);
    if (from === -1) return null;
    const to = from + direction;
    if (to < 0 || to >= current.length) return null;
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, id);
    options.commit(next);
    return to;
  }

  return { parentRef: parentRef as Ref<HTMLElement | undefined>, ids, moveByKeyboard };
}

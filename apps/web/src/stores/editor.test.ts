import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { HISTORY_CAP, useEditorStore } from './editor.ts';

function initStore() {
  const store = useEditorStore();
  store.initializeTemplate('t1');
  return store;
}

describe('editor store history', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  describe('push', () => {
    it('pushes a HistoryStep when a field is added', () => {
      const store = initStore();
      expect(store.canUndo).toBe(false);

      store.addTextField();

      expect(store.canUndo).toBe(true);
      expect(store.template?.fields.length).toBe(1);
    });

    it('pushes a HistoryStep when a field is deleted', () => {
      const store = initStore();
      const id = store.addTextField();
      expect(id).not.toBeNull();

      store.deleteField(id!);

      expect(store.canUndo).toBe(true);
      expect(store.template?.fields.length).toBe(0);
    });

    it('pushes a HistoryStep when required is toggled', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldRequired(id, true);

      expect(store.undoDepth).toBe(undoBefore + 1);
    });
  });

  describe('undo/redo', () => {
    it('undo restores the prior snapshot', () => {
      const store = initStore();
      store.addTextField();
      expect(store.template?.fields.length).toBe(1);

      store.undo();

      expect(store.template?.fields.length).toBe(0);
      expect(store.canRedo).toBe(true);
    });

    it('redo re-applies the undone change', () => {
      const store = initStore();
      const id = store.addTextField()!;
      store.undo();
      expect(store.template?.fields.length).toBe(0);

      store.redo();

      expect(store.template?.fields.length).toBe(1);
      expect(store.template?.fields[0]?.id).toBe(id);
    });

    it('multi-step undo/redo returns to the same final state', () => {
      const store = initStore();
      const a = store.addTextField()!;
      const b = store.addTextField()!;
      store.setFieldRequired(a, true);
      store.deleteField(b);

      store.undo();
      store.undo();
      store.undo();
      store.undo();
      expect(store.template?.fields.length).toBe(0);

      store.redo();
      store.redo();
      store.redo();
      store.redo();
      expect(store.template?.fields.length).toBe(1);
      expect(store.template?.fields[0]?.id).toBe(a);
      expect(store.template?.fields[0]?.required).toBe(true);
    });

    it('undo snapshots are deep copies (mutating live state does not corrupt history)', () => {
      const store = initStore();
      const id = store.addTextField()!;
      store.setFieldLabel(id, 'hello');
      vi.advanceTimersByTime(600);

      store.setFieldLabel(id, 'goodbye');
      vi.advanceTimersByTime(600);

      store.undo();
      expect(store.template?.fields[0]?.label).toBe('hello');
      store.undo();
      expect(store.template?.fields[0]?.label).toBe('');
    });

    it('a new mutation after undo clears the redo stack', () => {
      const store = initStore();
      store.addTextField();
      store.undo();
      expect(store.canRedo).toBe(true);

      store.addTextField();

      expect(store.canRedo).toBe(false);
    });

    it('undo and redo are no-ops when their respective stacks are empty', () => {
      const store = initStore();
      expect(() => store.undo()).not.toThrow();
      expect(() => store.redo()).not.toThrow();
      expect(store.template?.fields.length).toBe(0);
    });
  });

  describe('cap', () => {
    it('drops the oldest step when the cap is exceeded', () => {
      const store = initStore();
      for (let i = 0; i < HISTORY_CAP + 20; i++) {
        store.addTextField();
      }

      expect(store.undoDepth).toBe(HISTORY_CAP);

      for (let i = 0; i < HISTORY_CAP; i++) {
        store.undo();
      }
      expect(store.canUndo).toBe(false);
      expect(store.template?.fields.length).toBe(20);
    });
  });

  describe('coalescing', () => {
    it('coalesces sequential label edits within the typing-pause window into one step', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldLabel(id, 'h');
      store.setFieldLabel(id, 'he');
      store.setFieldLabel(id, 'hel');
      store.setFieldLabel(id, 'hell');
      store.setFieldLabel(id, 'hello');

      expect(store.undoDepth).toBe(undoBefore + 1);
      expect(store.template?.fields[0]?.label).toBe('hello');

      store.undo();
      expect(store.template?.fields[0]?.label).toBe('');
    });

    it('commits a new HistoryStep after the 500ms typing pause', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldLabel(id, 'hello');
      vi.advanceTimersByTime(600);
      store.setFieldLabel(id, 'hello world');

      expect(store.undoDepth).toBe(undoBefore + 2);
    });

    it('flushCoalesce closes the typing window so the next edit is a new step', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldLabel(id, 'hello');
      store.flushCoalesce();
      store.setFieldLabel(id, 'hello world');

      expect(store.undoDepth).toBe(undoBefore + 2);
    });

    it('switching to a different coalesce target starts a new step', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldLabel(id, 'hello');
      store.setFieldDescription(id, 'world');

      expect(store.undoDepth).toBe(undoBefore + 2);
    });

    it('a discrete mutation (add/delete/required) after a coalesced edit does not swallow it', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const undoBefore = store.undoDepth;

      store.setFieldLabel(id, 'hi');
      store.setFieldRequired(id, true);

      expect(store.undoDepth).toBe(undoBefore + 2);
    });
  });

  describe('no-op mutations do not push', () => {
    it('setting the same label value again does not push', () => {
      const store = initStore();
      const id = store.addTextField()!;
      store.setFieldLabel(id, 'hello');
      vi.advanceTimersByTime(600);
      const depth = store.undoDepth;

      store.setFieldLabel(id, 'hello');

      expect(store.undoDepth).toBe(depth);
      expect(store.template?.fields[0]?.label).toBe('hello');
    });

    it('setting required to its current value does not push', () => {
      const store = initStore();
      const id = store.addTextField()!;
      const depth = store.undoDepth;

      store.setFieldRequired(id, false);

      expect(store.undoDepth).toBe(depth);
    });

    it('deleting a non-existent field does not push', () => {
      const store = initStore();
      const depth = store.undoDepth;

      store.deleteField('does-not-exist');

      expect(store.undoDepth).toBe(depth);
    });

    it('setting the title to the same value does not push', () => {
      const store = initStore();
      const depth = store.undoDepth;

      store.setTitle('Untitled Form');
      vi.advanceTimersByTime(600);

      expect(store.undoDepth).toBe(depth);
    });
  });
});

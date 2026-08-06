import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { HISTORY_CAP, isChoiceField, useEditorStore } from './editor.ts';

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

describe('editor store — all field variants', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  it('adds a paragraph field with an empty placeholder', () => {
    const store = initStore();
    const id = store.addParagraphField()!;
    const field = store.findField(id);
    expect(field?.type).toBe('paragraph');
    if (field?.type === 'paragraph') {
      expect(field.placeholder).toBe('');
      expect(field.required).toBe(false);
    }
  });

  it('adds checkbox/radio/select fields with one initial option each having a UUID', () => {
    const store = initStore();
    for (const add of [
      () => store.addCheckboxField(),
      () => store.addRadioField(),
      () => store.addSelectField(),
    ] as const) {
      const id = add()!;
      const field = store.findField(id);
      expect(field).toBeDefined();
      expect(isChoiceField(field!)).toBe(true);
      if (field && isChoiceField(field)) {
        expect(field.options.length).toBe(1);
        expect(field.options[0]!.id).toMatch(/[0-9a-f-]{10,}/i);
      }
    }
  });

  it('setTextFieldPlaceholder works for paragraph fields too', () => {
    const store = initStore();
    const id = store.addParagraphField()!;
    store.setTextFieldPlaceholder(id, 'Long answer here…');
    const field = store.findField(id);
    if (field?.type === 'paragraph') {
      expect(field.placeholder).toBe('Long answer here…');
    }
  });

  it('setTextFieldPlaceholder is a no-op for choice fields', () => {
    const store = initStore();
    const id = store.addCheckboxField()!;
    const before = store.undoDepth;
    store.setTextFieldPlaceholder(id, 'nope');
    expect(store.undoDepth).toBe(before);
  });
});

describe('editor store — option-list mutations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  function seedRadio() {
    const store = initStore();
    const fieldId = store.addRadioField()!;
    return { store, fieldId };
  }

  it('addFieldOption appends an option with a fresh UUID and pushes a step', () => {
    const { store, fieldId } = seedRadio();
    const depth = store.undoDepth;

    const optionId = store.addFieldOption(fieldId)!;

    expect(store.undoDepth).toBe(depth + 1);
    const field = store.findField(fieldId);
    if (field && isChoiceField(field)) {
      expect(field.options.length).toBe(2);
      expect(field.options[1]!.id).toBe(optionId);
      expect(field.options[0]!.id).not.toBe(optionId);
    }
  });

  it('setFieldOptionLabel coalesces sequential edits into a single step', () => {
    const { store, fieldId } = seedRadio();
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const optionId = field.options[0]!.id;
    const depth = store.undoDepth;

    store.setFieldOptionLabel(fieldId, optionId, 'R');
    store.setFieldOptionLabel(fieldId, optionId, 'Re');
    store.setFieldOptionLabel(fieldId, optionId, 'Red');

    expect(store.undoDepth).toBe(depth + 1);
    const after = store.findField(fieldId);
    if (after && isChoiceField(after)) {
      expect(after.options[0]!.label).toBe('Red');
    }
  });

  it('setFieldOptionLabel starts a new step after the typing-pause window', () => {
    const { store, fieldId } = seedRadio();
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const optionId = field.options[0]!.id;
    const depth = store.undoDepth;

    store.setFieldOptionLabel(fieldId, optionId, 'Red');
    vi.advanceTimersByTime(600);
    store.setFieldOptionLabel(fieldId, optionId, 'Reddish');

    expect(store.undoDepth).toBe(depth + 2);
  });

  it('editing two different options starts two distinct coalesce windows', () => {
    const { store, fieldId } = seedRadio();
    const a = store.findField(fieldId);
    if (!a || !isChoiceField(a)) throw new Error('bad seed');
    const firstId = a.options[0]!.id;
    const secondId = store.addFieldOption(fieldId)!;
    const depth = store.undoDepth;

    store.setFieldOptionLabel(fieldId, firstId, 'Red');
    store.setFieldOptionLabel(fieldId, secondId, 'Blue');

    expect(store.undoDepth).toBe(depth + 2);
  });

  it('deleteFieldOption removes the option immediately and pushes a step', () => {
    const { store, fieldId } = seedRadio();
    const optionId = store.addFieldOption(fieldId)!;
    const depth = store.undoDepth;

    store.deleteFieldOption(fieldId, optionId);

    expect(store.undoDepth).toBe(depth + 1);
    const field = store.findField(fieldId);
    if (field && isChoiceField(field)) {
      expect(field.options.some((o) => o.id === optionId)).toBe(false);
    }
  });

  it('deleteFieldOption is a no-op when the option id is unknown', () => {
    const { store, fieldId } = seedRadio();
    const depth = store.undoDepth;

    store.deleteFieldOption(fieldId, 'nope');

    expect(store.undoDepth).toBe(depth);
  });

  it('moveFieldOption reorders options and pushes a step', () => {
    const { store, fieldId } = seedRadio();
    const b = store.addFieldOption(fieldId)!;
    const c = store.addFieldOption(fieldId)!;
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const a = field.options[0]!.id;
    const depth = store.undoDepth;

    store.moveFieldOption(fieldId, c, 0);

    expect(store.undoDepth).toBe(depth + 1);
    const after = store.findField(fieldId);
    if (after && isChoiceField(after)) {
      expect(after.options.map((o) => o.id)).toEqual([c, a, b]);
    }
  });

  it('moveFieldOption is a no-op when the option ends where it started', () => {
    const { store, fieldId } = seedRadio();
    store.addFieldOption(fieldId);
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const a = field.options[0]!.id;
    const depth = store.undoDepth;

    store.moveFieldOption(fieldId, a, 0);

    expect(store.undoDepth).toBe(depth);
  });

  it('option ids survive relabel and reorder', () => {
    const { store, fieldId } = seedRadio();
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const originalId = field.options[0]!.id;

    store.setFieldOptionLabel(fieldId, originalId, 'Renamed');
    vi.advanceTimersByTime(600);
    const secondId = store.addFieldOption(fieldId)!;
    store.moveFieldOption(fieldId, originalId, 1);

    const after = store.findField(fieldId);
    if (after && isChoiceField(after)) {
      expect(after.options.map((o) => o.id)).toEqual([secondId, originalId]);
      expect(after.options.find((o) => o.id === originalId)!.label).toBe('Renamed');
    }
  });

  it('undo reverts an option addition; redo re-applies it', () => {
    const { store, fieldId } = seedRadio();
    const before = store.findField(fieldId);
    if (!before || !isChoiceField(before)) throw new Error('bad seed');
    const beforeCount = before.options.length;

    const newOptionId = store.addFieldOption(fieldId)!;

    store.undo();
    const undone = store.findField(fieldId);
    if (undone && isChoiceField(undone)) {
      expect(undone.options.length).toBe(beforeCount);
    }

    store.redo();
    const redone = store.findField(fieldId);
    if (redone && isChoiceField(redone)) {
      expect(redone.options.some((o) => o.id === newOptionId)).toBe(true);
    }
  });

  it('undo reverts an option deletion, restoring its id and label', () => {
    const { store, fieldId } = seedRadio();
    const optionId = store.addFieldOption(fieldId)!;
    store.setFieldOptionLabel(fieldId, optionId, 'Blue');
    vi.advanceTimersByTime(600);

    store.deleteFieldOption(fieldId, optionId);

    store.undo();
    const field = store.findField(fieldId);
    if (field && isChoiceField(field)) {
      const restored = field.options.find((o) => o.id === optionId);
      expect(restored?.label).toBe('Blue');
    }
  });

  it('undo reverts an option reorder', () => {
    const { store, fieldId } = seedRadio();
    const b = store.addFieldOption(fieldId)!;
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const a = field.options[0]!.id;

    store.moveFieldOption(fieldId, b, 0);

    store.undo();
    const after = store.findField(fieldId);
    if (after && isChoiceField(after)) {
      expect(after.options.map((o) => o.id)).toEqual([a, b]);
    }
  });

  it('undo of a coalesced option-label edit reverts the whole run', () => {
    const { store, fieldId } = seedRadio();
    const field = store.findField(fieldId);
    if (!field || !isChoiceField(field)) throw new Error('bad seed');
    const optionId = field.options[0]!.id;

    store.setFieldOptionLabel(fieldId, optionId, 'R');
    store.setFieldOptionLabel(fieldId, optionId, 'Re');
    store.setFieldOptionLabel(fieldId, optionId, 'Red');

    store.undo();
    const after = store.findField(fieldId);
    if (after && isChoiceField(after)) {
      expect(after.options[0]!.label).toBe('');
    }
  });
});

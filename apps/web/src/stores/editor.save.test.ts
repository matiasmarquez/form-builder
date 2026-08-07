import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  setTemplateSaveTransport,
  useEditorStore,
  VisibilityCycleError,
  type TemplateSaveTransport,
} from './editor.ts';

function makeTransport(): TemplateSaveTransport & {
  createCalls: number;
  updateCalls: number;
  fail: boolean;
} {
  const t = {
    createCalls: 0,
    updateCalls: 0,
    fail: false,
    async create() {
      t.createCalls++;
      if (t.fail) throw new Error('boom');
    },
    async update() {
      t.updateCalls++;
      if (t.fail) throw new Error('boom');
    },
  };
  return t;
}

describe('editor store — isDirty / isPersisted', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setTemplateSaveTransport(null);
  });

  it('initializeTemplate marks the store as unpersisted and clean', () => {
    const store = useEditorStore();
    store.initializeTemplate('t1');

    expect(store.isPersisted).toBe(false);
    expect(store.isDirty).toBe(false);
    expect(store.saveStatus).toBe('idle');
  });

  it('loadTemplate marks the store as persisted and clean', () => {
    const store = useEditorStore();
    store.loadTemplate({
      id: 't1',
      title: 'Loaded',
      description: '',
      fields: [],
      createdAt: 1,
      updatedAt: 2,
    });

    expect(store.isPersisted).toBe(true);
    expect(store.isDirty).toBe(false);
    expect(store.saveStatus).toBe('saved');
  });

  it('a user mutation flips isDirty true', () => {
    const store = useEditorStore();
    store.initializeTemplate('t1');
    expect(store.isDirty).toBe(false);

    store.addTextField();

    expect(store.isDirty).toBe(true);
  });

  it('title/label edits flip isDirty during coalesce (before a HistoryStep is committed)', () => {
    const store = useEditorStore();
    store.initializeTemplate('t1');
    const id = store.addTextField()!;
    // A successful save clears isDirty (below), but even continuing an
    // in-flight coalesced typing run must keep it true.
    store.isDirty = false;

    store.setFieldLabel(id, 'h');
    store.setFieldLabel(id, 'he');

    expect(store.isDirty).toBe(true);
  });
});

describe('editor store — save', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('POSTs on first save when unpersisted, then PUTs on subsequent saves', async () => {
    const transport = makeTransport();
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.initializeTemplate('t1');
    store.setTitle('Draft');

    await store.save();
    expect(transport.createCalls).toBe(1);
    expect(transport.updateCalls).toBe(0);
    expect(store.isPersisted).toBe(true);
    expect(store.isDirty).toBe(false);
    expect(store.saveStatus).toBe('saved');

    store.setTitle('Revised');
    await store.save();
    expect(transport.createCalls).toBe(1);
    expect(transport.updateCalls).toBe(1);
  });

  it('save() is a no-op when clean and persisted', async () => {
    const transport = makeTransport();
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.loadTemplate({
      id: 't1',
      title: 't',
      description: '',
      fields: [],
      createdAt: 1,
      updatedAt: 2,
    });

    await store.save();

    expect(transport.createCalls).toBe(0);
    expect(transport.updateCalls).toBe(0);
  });

  it('failed save keeps isDirty true and surfaces the failed status', async () => {
    const transport = makeTransport();
    transport.fail = true;
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.initializeTemplate('t1');
    store.setTitle('Draft');

    await expect(store.save()).rejects.toThrow('boom');

    expect(store.isDirty).toBe(true);
    expect(store.isPersisted).toBe(false);
    expect(store.saveStatus).toBe('failed');
    expect(store.lastSaveError).toBe('boom');
  });

  it('an edit that happens mid-save keeps isDirty true after the save resolves', async () => {
    let resolveCreate: (() => void) | null = null;
    const transport: TemplateSaveTransport = {
      create: () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
      update: async () => {},
    };
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.initializeTemplate('t1');
    store.setTitle('Draft');

    const savePromise = store.save();
    // Simulate the user typing during the in-flight request.
    store.setTitle('Draft-plus-more');
    expect(store.saveStatus).toBe('saving');

    resolveCreate!();
    await savePromise;

    expect(store.isPersisted).toBe(true);
    expect(store.isDirty).toBe(true);
    expect(store.saveStatus).toBe('saved');
  });

  it('refuses to save a template whose visibility rules form a cycle', async () => {
    const transport = makeTransport();
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.initializeTemplate('t1');
    const aId = store.addRadioField()!;
    const bId = store.addRadioField()!;
    // Build a 2-node cycle: each field's visibility points at the other.
    // The option ids don't matter for cycle detection.
    const aOption = store.template!.fields.find((f) => f.id === aId)! as {
      options: { id: string }[];
    };
    const bOption = store.template!.fields.find((f) => f.id === bId)! as {
      options: { id: string }[];
    };
    store.setFieldVisibility(aId, {
      sourceFieldId: bId,
      condition: { kind: 'equals', optionId: bOption.options[0]!.id },
    });
    store.setFieldVisibility(bId, {
      sourceFieldId: aId,
      condition: { kind: 'equals', optionId: aOption.options[0]!.id },
    });

    await expect(store.save()).rejects.toBeInstanceOf(VisibilityCycleError);
    expect(transport.createCalls).toBe(0);
    expect(transport.updateCalls).toBe(0);
    expect(store.saveStatus).toBe('failed');
    expect(store.lastSaveError).toMatch(/ciclo/i);
    expect(store.isPersisted).toBe(false);
    expect(store.isDirty).toBe(true);
  });

  it('undo/redo flip isDirty even when they return to a previously saved state', async () => {
    const transport = makeTransport();
    setTemplateSaveTransport(transport);
    const store = useEditorStore();
    store.initializeTemplate('t1');
    store.addTextField();
    await store.save();
    expect(store.isDirty).toBe(false);

    store.undo();

    expect(store.isDirty).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteTemplate, fetchTemplateList } from './api.ts';

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function mockFetch(handler: (...args: FetchArgs) => Response | Promise<Response>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (...args: FetchArgs) => handler(...args)) as unknown as typeof fetch,
  );
}

describe('fetchTemplateList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the list response into TemplateListItem[]', async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify([
            { id: 'a', title: 'A', updatedAt: 2 },
            { id: 'b', title: 'B', updatedAt: 1 },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );

    const items = await fetchTemplateList();
    expect(items).toEqual([
      { id: 'a', title: 'A', updatedAt: 2 },
      { id: 'b', title: 'B', updatedAt: 1 },
    ]);
  });

  it('throws when the server responds non-2xx', async () => {
    mockFetch(() => new Response('boom', { status: 500 }));
    await expect(fetchTemplateList()).rejects.toThrow(/500/);
  });

  it('rejects malformed rows via schema parse', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify([{ id: 'a' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    await expect(fetchTemplateList()).rejects.toBeTruthy();
  });
});

describe('deleteTemplate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('DELETEs the template by id', async () => {
    const spy = vi.fn(async (..._args: FetchArgs) => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', spy as unknown as typeof fetch);
    await deleteTemplate('t1');
    expect(spy).toHaveBeenCalledOnce();
    const call = spy.mock.calls[0]!;
    expect(String(call[0])).toBe('/api/templates/t1');
    expect(call[1]?.method).toBe('DELETE');
  });

  it('treats 404 as success (already gone)', async () => {
    mockFetch(() => new Response(null, { status: 404 }));
    await expect(deleteTemplate('gone')).resolves.toBeUndefined();
  });

  it('throws on non-2xx, non-404', async () => {
    mockFetch(() => new Response('boom', { status: 500 }));
    await expect(deleteTemplate('t1')).rejects.toThrow(/500/);
  });
});

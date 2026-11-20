import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { loadMenu, MenuRequestError, saveMenu, type Definition, type Offering } from './menu-api.ts';

const menuKey = ['menu'] as const;

function loadErrorMessage(cause: unknown) {
  return cause instanceof MenuRequestError && (cause.status === 401 || cause.status === 403)
    ? 'Your session or permission could not be confirmed. Return to the workspace and sign in again.'
    : 'The menu could not be loaded. Try again.';
}

export function useMenu() {
  const menu = useQuery({ queryKey: menuKey, queryFn: loadMenu, gcTime: 0, refetchOnMount: 'always' });
  const [error, setError] = useState('');
  const [readingAfterSave, setReadingAfterSave] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<Offering>();
  const [savedId, setSavedId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offering>();
  const saveMutation = useMutation({ mutationFn: (definition: Definition) => saveMenu(definition, editing) });

  async function refresh() {
    try {
      await menu.refetch({ throwOnError: true });
      setError('');
    } catch (cause) {
      setError(loadErrorMessage(cause));
    }
  }

  async function save(definition: Definition) {
    setError('');
    let id: string;
    try {
      id = await saveMutation.mutateAsync(definition);
    } catch (cause) {
      if (cause instanceof MenuRequestError && cause.status < 500) {
        if (cause.status === 409 && editing) {
          setConflict(true);
          setLatest(undefined);
        }
        setError(cause.status === 409
          ? 'The server could not save this item because the menu or its configuration may have changed. Reload and review the current menu before retrying.'
          : cause.status === 401 || cause.status === 403
            ? 'Your session or permission could not be confirmed. Your changes have not been saved.'
            : 'The server could not accept this item. Check the details and try again.');
      } else {
        setUncertain(true);
        setError('The save result is unknown. Reload the menu and check for the item before trying again. Names can be repeated.');
      }
      return;
    }
    setSavedId(id);
    setOpen(false);
    setReadingAfterSave(true);
    try { await refresh(); } finally { setReadingAfterSave(false); }
  }

  async function reloadWhileEditing() {
    try {
      const result = await menu.refetch({ throwOnError: true });
      if (conflict && editing) setLatest(result.data?.definitions.find(row => row.id === editing.id));
    } catch {
      setError('Could not reload the menu. Your draft is still here.');
    }
  }

  function startEditing(offering?: Offering) {
    setConflict(false);
    setEditing(offering);
    setOpen(true);
  }

  function closeEditor() {
    setOpen(false);
    if (uncertain || conflict) void refresh();
  }

  function useLatest() {
    if (!latest) return;
    setEditing(latest);
    setConflict(false);
    setError('Review your draft against the current saved version before saving.');
  }

  const data = menu.isError ? undefined : menu.data;
  return {
    definitions: data?.definitions ?? [], active: data?.active ?? [], currency: data?.currency ?? '',
    loading: menu.isFetching, error: error || (menu.isError ? loadErrorMessage(menu.error) : ''),
    saving: saveMutation.isPending || readingAfterSave, uncertain, conflict, latest, savedId, open, editing,
    refresh, save, reloadWhileEditing, startEditing, closeEditor, useLatest,
    acknowledgeReview: () => setUncertain(false),
  };
}

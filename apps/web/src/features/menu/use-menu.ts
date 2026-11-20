import { useCallback, useEffect, useState } from 'react';
import { loadMenu, MenuRequestError, saveMenu, type Definition, type Offering } from './menu-api';

export function useMenu() {
  const [definitions, setDefinitions] = useState<Offering[]>([]);
  const [active, setActive] = useState<Offering[]>([]);
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<Offering>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offering>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadMenu();
      setDefinitions(data.definitions);
      setActive(data.active);
      setCurrency(data.currency);
      setError('');
    } catch (cause) {
      setDefinitions([]);
      setActive([]);
      setError(cause instanceof MenuRequestError && (cause.status === 401 || cause.status === 403)
        ? 'Your session or permission could not be confirmed. Return to the workspace and sign in again.'
        : 'The menu could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(definition: Definition) {
    setSaving(true);
    setError('');
    try {
      await saveMenu(definition, editing);
      setOpen(false);
      await refresh();
    } catch (cause) {
      if (cause instanceof MenuRequestError && cause.status < 500) {
        if (cause.status === 409 && editing) {
          setConflict(true);
          setLatest(undefined);
        }
        setError(cause.status === 409 && editing
          ? 'The item or one of its choices changed. Reload the menu below and review the current version before retrying.'
          : cause.status === 401 || cause.status === 403
            ? 'Your session or permission could not be confirmed. Your changes have not been saved.'
            : 'The server could not accept this item. Check the details and try again.');
      } else {
        setUncertain(true);
        setError('The save result is unknown. Reload the menu and check for the item before trying again. Names can be repeated.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function reloadWhileEditing() {
    try {
      const data = await loadMenu();
      setDefinitions(data.definitions);
      setActive(data.active);
      setCurrency(data.currency);
      if (conflict && editing) setLatest(data.definitions.find(row => row.id === editing.id));
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

  return {
    definitions, active, currency, loading, error, saving, uncertain, conflict, latest, open, editing,
    refresh, save, reloadWhileEditing, startEditing, closeEditor, useLatest,
    acknowledgeReview: () => setUncertain(false),
  };
}

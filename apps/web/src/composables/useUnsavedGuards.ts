import { onBeforeUnmount, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useEditorStore } from '../stores/editor.ts';

// Warn on hard navigation (tab close, reload, url bar change) and prompt on
// in-app route changes if the editor still has unsaved edits.
export function useUnsavedGuards(): void {
  const editor = useEditorStore();

  function onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!editor.isDirty) return;
    // some browsers still require both preventDefault 
    // and a non-empty returnValue for the prompt.
    event.preventDefault();
    event.returnValue = '';
  }

  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
  });

  onBeforeRouteLeave(() => {
    if (!editor.isDirty) return true;
    // eslint-disable-next-line no-alert
    const proceed = window.confirm(
      'You have unsaved changes. Leave and discard them?',
    );
    return proceed;
  });
}

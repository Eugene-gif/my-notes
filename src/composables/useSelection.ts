import { computed, ref, watch, type Ref } from 'vue';
import type { Entry } from '@/types/notes';
export function useSelection(entries: Ref<Entry[]>) {
  const selecting = ref(false);
  const selected = ref(new Set<string>());
  const ids = computed(() =>
    entries.value.filter((entry) => selected.value.has(entry.id)).map((entry) => entry.id),
  );
  const finish = () => {
    selecting.value = false;
    selected.value = new Set();
  };
  const toggleMode = () => {
    if (!entries.value.length) return;
    selecting.value = !selecting.value;
    selected.value = new Set();
  };
  const toggle = (id: string) => {
    if (!entries.value.some((entry) => entry.id === id)) return;
    selected.value.has(id) ? selected.value.delete(id) : selected.value.add(id);
  };
  const mark = (id: string) => {
    if (entries.value.some((entry) => entry.id === id)) {
      selecting.value = true;
      selected.value.add(id);
    }
  };
  const toggleAll = () => {
    selected.value =
      ids.value.length === entries.value.length
        ? new Set()
        : new Set(entries.value.map((entry) => entry.id));
  };
  const dragIds = (id: string) => (selecting.value && selected.value.has(id) ? ids.value : [id]);
  watch(entries, (value) => {
    selected.value = new Set(
      [...selected.value].filter((id) => value.some((entry) => entry.id === id)),
    );
    if (!value.length) finish();
  });
  return { selecting, selected, ids, finish, toggleMode, toggle, toggleAll, mark, dragIds };
}

import { expect, it } from 'vitest';
import { useNoticesStore } from '@/store/noticesStore';

it('replaces notices, validates timeouts and closes explicitly', () => {
	const store = useNoticesStore();
	store.show('First', 'info', { duration: 0, closable: false });
	const id = store.current!.id;
	store.show('Error', 'error');
	expect(store.current).toMatchObject({ message: 'Error', status: 'error', duration: 2000 });
	expect(store.current!.id).toBeGreaterThan(id);
	expect(() => store.show('x', 'info', { duration: NaN })).toThrow();
	store.close();
	expect(store.current).toBeNull();
});

import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import Breadcrumbs from '@/components/Breadcrumbs.vue';
import { fixture } from '../../fixtures';
import { useNotesStore } from '@/store/notesStore';

it('navigates through ancestors and locks navigation during selection', async () => {
	const state = fixture();
	useNotesStore().state = state;
	const wrapper = mount(Breadcrumbs, { props: { path: state.folders, selecting: false } });
	const links = wrapper.findAll('nav button');
	expect(links).toHaveLength(3);
	await links[1].trigger('click');
	expect(wrapper.emitted('navigate')?.[0]).toEqual(['folder']);
	await wrapper.setProps({ selecting: true });
	await wrapper.findAll('nav button')[0].trigger('click');
	expect(wrapper.emitted('navigate')).toHaveLength(1);
});

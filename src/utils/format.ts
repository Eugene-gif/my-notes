const formatFolderName = (date: Date = new Date()) => {
	const parts = new Intl.DateTimeFormat('ru-RU', {
		timeZone: 'Europe/Moscow',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);

	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)!.value;

	return `${value('day')}.${value('month')}.${value('year')} в ${value('hour')}:${value('minute')}`;
};

const pluralize = (count: number, forms: readonly [string, string, string]): string => {
	const value = Math.abs(count);
	const form =
		value % 100 >= 11 && value % 100 <= 14
			? forms[2]
			: value % 10 === 1
				? forms[0]
				: value % 10 >= 2 && value % 10 <= 4
					? forms[1]
					: forms[2];

	return count + ' ' + form;
};

const taskCount = (count: number) => pluralize(count, ['задача', 'задачи', 'задач']);

const elementCount = (count: number) => pluralize(count, ['элемент', 'элемента', 'элементов']);

const containerNoun = (type: string) =>
	type === 'note' ? 'заметку' : type === 'checklist' ? 'перечень' : 'папку';

export { formatFolderName, pluralize, taskCount, elementCount, containerNoun };

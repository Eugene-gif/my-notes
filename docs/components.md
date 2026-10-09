# Компоненты

Каждый компонент находится в своей папке в `src/components`: `Name.vue` содержит шаблон и `<script setup lang="ts">`, рядом лежит `Name.css`. Общие цвета, сброс и базовая карточка — в `src/style.css`. Пользовательский текст выводится через интерполяцию Vue; `v-html` используется только для SVG из исходников.

| Компонент          | Основная ответственность и контракт                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| NotesWorkspace     | Собирает экран, соединяет Router и stores, управляет формами и подтверждениями.                                                      |
| EntryList          | Выводит элементы с ключом id и раскладкой. В перечне принудительно одна колонка; события add передают before/after.                  |
| TaskCard           | Текст, статус и разворачивание задачи; toggle, select, action передают id. Не сохраняет данные самостоятельно.                       |
| ContainerCard      | Карточка папки, перечня или заметки; статистика и иконка. События open, select, action.                                              |
| ActionMenu         | Меню действий; props actions, label, toolbar; события action и open-change. Поддерживает Escape, стрелки, Home/End и возврат фокуса. |
| Breadcrumbs        | Путь раздела и кнопка назад; при переполнении показывает полный путь в диалоге. navigate передаёт id или null.                       |
| NoteView           | Чтение заметки или редактор; edit, cancel, save.                                                                                     |
| EntryForm          | Локальный черновик создания/редактирования; props type, entry, inline; save(name, description), cancel. Пустая задача запрещена.     |
| BaseDialog         | Нативный dialog; v-model управляет открытием, title задаёт доступное имя. Закрытие крестиком, Escape или по фону. Контент — slot.    |
| AddEntryPicker     | Выбор папки, заметки или перечня; choose(type).                                                                                      |
| LayoutPicker       | Выбор 1/2/3 колонок через v-model.                                                                                                   |
| SearchDialog       | Поиск с задержкой 300 мс; v-model, currentId; navigate(entry). В перечне ищет только его задачи.                                     |
| HighlightText      | Вывод текста с mark для совпадений; props text, query. Не интерпретирует HTML пользователя.                                          |
| SelectionToolbar   | Счётчик выбранных и групповые действия; count, total; all, remove, cancel.                                                           |
| DropActionMenu     | Выбор переноса в папку или обмена; pending; choose(move/swap), cancel. Проверяет допустимость операций.                              |
| Notice             | Единственное глобальное уведомление; props top и width. Использует noticesStore и useNotice.                                         |
| Button             | Базовая кнопка со slot; type, disabled, danger. Остальные атрибуты и события передаются кнопке.                                      |
| Input              | Подписанное текстовое поле; id, label, type, placeholder, required, autofocus; строковый v-model.                                    |
| AutoResizeTextarea | Подписанное многострочное поле с v-model; растёт до границы экрана/формы; expose resize().                                           |

## Уведомления

```ts
const notices = useNoticesStore();
notices.show('Сохранено.', 'success');
notices.show('Не удалось сохранить.', 'error');
notices.show('Операция выполняется…', 'info', { duration: 0, closable: true });
notices.close();
```

Статусы: success, error, info. По умолчанию duration = 2000 мс и closable = true; duration = 0 отключает автозакрытие. Новое сообщение заменяет предыдущее. Ошибки имеют role=alert, остальные сообщения — role=status. Текст безопасно выводится как текст. Уведомление использует Popover API и перемещается внутрь открытого диалога. Таймеры и MutationObserver очищаются при демонтаже. Цвета настраиваются переменными --notice-* в style.css.

Компонентные тесты повторяют эту структуру в `tests/src/components`. Архитектурные правила: [architecture.md](architecture.md).

// $lib/locales/translations.ts
interface Translations {
  [language: string]: { [key: string]: string }
}

const translations: Translations = {
  ru: {
    /* Блок авторизации и регистрации */
    'auth.email': 'E-Mail',
    'auth.password': 'Пароль',
    'auth.register': 'Регистрация',
    'auth.login': 'Войти',
    'auth.profile': 'Профиль',
    'auth.logout': 'Выйти',

    /* МЕНЮ */
    'nav.company': 'КОМПАНИЯ',
    'nav.catalog': 'КАТАЛОГ',
    'nav.catalog.modules': 'Модули',
    'nav.catalog.products': 'Изделия',
    'nav.catalog.system': 'Оснастка',
    'nav.catalog.development': 'В разработке',
    'nav.dashboard': 'КАБИНЕТ',
    'nav.dashboard.profile': 'Профиль',
    'nav.dashboard.devices': 'Изделия',
    'nav.dashboard.news': 'Новости',
    'nav.dashboard.chat': 'Чат',
    'nav.news': 'НОВОСТИ',
    'nav.service': 'ОБСЛУЖИВАНИЕ',
    'nav.service.catalog': 'Каталог',
    'nav.service.users': 'Пользователи',
    'nav.service.info': 'Новости',
    'nav.service.websocket': 'WebSocket',
    'nav.service.ui-constructor': 'UI коструктор',

    /* Общие названия */
    'common.footer': 'Все права защищены ©',
    'common.delete_item': 'Вы действительно хотите удалить: ',
    'common.delete': 'Удалить',
    'common.ok': 'ОК',
    'common.system.message': 'Служебное сообщение',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.edit': 'Редактировать',
    'common.add': 'Добавить',
    'common.send': 'Отправить',
    'common.activate': 'Активировать',
    'common.block': 'Заблокировать',
    'common.publish': 'Опубликовать',
    'common.disable': 'Отключить',
    'common.expand': 'Подробнее',
    'common.collapse': 'Свернуть',
    'common.create': 'Создать',
    'common.update': 'Обновить',
    'common.search': 'Найти',
    'common.select_tag': 'Сделайте выбор',
    'common.dynamic.user': 'Информация о пользователе',
    'common.dynamic.name': 'Имя: ',
    'common.dynamic.nickname': 'Псевдоним: ',
    'common.dynamic.department': 'Подразделение: ',
    'common.dynamic.email': 'E-Mail: ',
    'common.dynamic.tel': 'Телефон: ',
    'common.dynamic.role': 'Роль: ',
    'common.dynamic.userid': 'Идентификатор: ',
    'common.dynamic.aboutme': 'О себе: ',
    'common.dynamic.device': 'Информация об устройстве',
    'common.controls': 'Панель упрвления',
    'common.nodata': 'Нет данных',
    'common.devid.development': 'В разработке',
    'common.devid.module': 'Модуль',
    'common.devid.water': 'Вода',
    'common.devid.ground': 'Земля',
    'common.devid.air': 'Воздух',
    'common.devid.space': 'Космос',
    'common.devid.system': 'Оснастка',

    /* КОМПОНЕНТЫ */
    'component.colorpicker.hex': 'HEX код (RGB)',
    'component.colorpicker.brightness': 'Яркость',

    /* КОМПАНИЯ */
    'company.title': 'Облачный ресурс ОАО "Пеленг": Инновационное решение для управления данными',

    /* КАТАЛОГ */
    'catalog.modules.title': 'Модули',
    'catalog.products.title': 'Изделия',
    'catalog.development.title': 'Продукция в разработке',
    'catalog.system.title': 'Оснастка',
    'catalog.icon': 'Иконка',
    'catalog.id': 'Код',
    'catalog.name': 'Имя',
    'catalog.verfw': 'Версия',
    'service.catalog.action': 'Действия',
    'catalog.brief': 'Описание',
    'catalog.nums': 'Загружено: ',

    /* ПАНЕЛЬ УПРАВЛЕНИЯ - Профиль пользователя */
    'dashboard.profile.title': 'Профиль пользователя',
    'dashboard.profile.main': 'Профиль',
    'dashboard.profile.userid': 'ID пользователя',
    'dashboard.profile.location': 'Контакты',
    'dashboard.profile.tags': 'Теги',
    'dashboard.profile.avatar': 'Фото профиля',
    'dashboard.profile.nickname': 'Псевдоним',
    'dashboard.profile.aboutme': 'О себе',
    'dashboard.profile.firstname': 'Имя',
    'dashboard.profile.lastname': 'Фамилия',
    'dashboard.profile.department': 'Подразделение',
    'dashboard.profile.email': 'E-Mail',
    'dashboard.profile.tel': 'Телефон',
    'dashboard.profile.password': 'Новый пароль',
    'dashboard.profile.country': 'Страна',
    'dashboard.profile.region': 'Регион',
    'dashboard.profile.city': 'Город',
    'dashboard.profile.address': 'Адрес',
    'dashboard.profile.postcode': 'Почтовый индекс',
    'dashboard.profile.delete': 'Удалить аккаунт',
    'dashboard.profile.save': 'Сохранить изменения',
    /* Устройства пользователя */
    'dashboard.device.title': 'Устройства пользователя',
    'dashboard.device.tags': 'Селектор устройств',
    'dashboard.device.reset': 'Все устройства',
    'dashboard.device.add_device': 'Регистрация устройств',
    'dashboard.device.device_sn': 'Серийный номер',
    'dashboard.device.err_data': 'Данные неверны',
    'dashboard.device.add': 'Зарегистрировать',
    'dashboard.device.change_tag': 'Сменить Тег',
    'dashboard.device.devs_num': 'Загружено устройств: ',
    'dashboard.device.selectmodule': 'Модуль не выбран',
    'dashboard.device.modules_num': 'Всего модулей: ',
    'dashboard.device.catid': 'Идентификатор по каталогу',
    'dashboard.device.name': 'Имя изделия',
    'dashboard.device.catverfw': 'Доступна',
    'dashboard.device.devfw': 'Прошивка',
    'dashboard.device.unknownui': 'Неизвестный элемент интерфейса',
    'dashboard.device.offline': 'Устройство не найдено',
    'dashboard.device.loadproblem': 'Возникли проблемы при загрузке модулей',
    /* Новости */
    'dashboard.news.title': 'Новости пользователя',
    'dashboard.news.author': 'Автор: ',
    'dashboard.news.date': 'Опубликовано: ',
    'dashboard.news.header': 'Заголовок',
    'dashboard.news.brief': 'Краткое содержание',
    'dashboard.news.content': 'Содержание новости',
    'dashboard.news.title_edit': 'Редактировать новость',
    'dashboard.news.title_create': 'Создать новость',
    /* Чат */
    'dashboard.chat.title': 'Чаты',
    'dashboard.chat.selectchat': 'Текущий чат',

    /* ГРУППЫ (чаты) */
    'group.title': 'Чаты',
    'group.personal': 'Личная группа',
    'group.error_personal': 'Группа не определена',

    /* НОВОСТИ */
    'news.title': 'Новости',
    'news.author': 'Автор: ',
    'news.date': 'Опубликовано: ',

    /* ОБСЛУЖИВАНИЕ ОБЛАКА */
    /* Обслуживание каталога */
    'service.catalog.title': 'Обслуживание каталога',
    'service.catalog.title_search': 'Поиск по каталогу',
    'service.catalog.create': 'Создать новое устройство',
    /* UI Конструктор */
    'service.constructor.title': 'UI Конструктор',
    'service.constructor.yaml_input': 'Загрузить yaml файл',
    'service.constructor.load': 'Загрузить',
    'service.constructor.save': 'Сохранить',
    'service.constructor.api_name': 'ID устройства',
    'service.constructor.api_lang': 'Язык API',
    /* Модальное окно и страница устройства */
    'service.catalog.title_create': 'Создать устройство',
    'service.catalog.title_edit': 'Редактировать устройство',
    'service.catalog.devid': 'Код по каталогу',
    'service.catalog.category': 'Категория',
    'service.catalog.type': 'Тип',
    'service.catalog.model': 'Модель',
    'service.catalog.revision': 'Ревизия',
    'service.catalog.devname': 'Имя устройства',
    'service.catalog.created': 'Создан',
    'service.catalog.updated': 'Обновлен',
    'service.catalog.brief': 'Краткое описание',
    'service.catalog.description': 'Описание',
    'service.catalog.verfw': 'Версия ПО',
    'service.catalog.append_core': 'Выберите файл прошивки (bin)',
    'service.catalog.append_manual': 'Выберите файл описания (pdf)',
    'service.catalog.append_api': 'Выберите файл API (yaml)',
    /* Обслуживание пользователей */
    'service.user.title': 'Обслуживание пользователей',
    'service.user.title.search': 'Поиск в базе данных',
    'service.user.roles.user': 'Пользователь',
    'service.user.roles.engineer': 'Инженер',
    'service.user.roles.manager': 'Менеджер',
    'service.user.roles.admin': 'Администратор',
    'service.user.icon': 'Аватар',
    'service.user.info': 'Информация',
    'service.user.role_tabl': 'Роль',
    'service.user.action': 'Действия',
    'service.user.aboutme': 'О себе',
    'service.user.edit_my_profile': 'Перейти в профиль',
    'service.user.user_num': 'Загружено пользователей: ',
    /* Модальное окно редактора аккаунта */
    'service.user.mod_title': 'Редактор профиля пользователя',
    'service.user.main': 'Основная информация',
    'service.user.avatar': 'Аватар',
    'service.user.userid': 'ID пользователя',
    'service.user.nickname': 'Псевдоним',
    'service.user.role': 'Роль',
    'service.user.firstname': 'Имя',
    'service.user.lastname': 'Фамилия',
    'service.user.department': 'Подразделение',
    'service.user.email': 'E-Mail',
    'service.user.tel': 'Телефон',
    'service.user.password': 'Новый пароль',
    'service.user.location': 'Адрес',
    'service.user.country': 'Страна',
    'service.user.region': 'Регион',
    'service.user.city': 'Город',
    'service.user.address': 'Адрес',
    'service.user.postcode': 'Почтовый индекс',
    'service.user.tags': 'Селектор',
    'service.user.title_tags': 'Теги селектора',
    'service.user.devices': 'Устройства',
    'service.user.title_devices': 'Редактор устройств',
    'service.user.select_tag': 'Выберите Тег',
    'service.user.add_devices': 'Добавить устройство',
    'service.user.no_devices': 'У пользователя нет устройств',
    'service.user.devices_list': 'Список устройств пользователя',
    /* НОВОСТИ */
    'service.news.title': 'Редактор новостей',
    'service.news.save_no_data': 'Неполный пакет данных для обновления новости',
    /* WEBSOCKET */
    'service.websocket.title': 'WebSocket',
    'service.websocket.groups': 'Группы WS на текущий момент',
    'service.websocket.messages': 'Сообщения',

    /* ПРОДУКЦИЯ */
    'products.category': 'Категория',
    'products.type': 'Тип',
    'products.model': 'Модель',
    'products.revision': 'Ревизия',
    'products.devname': 'Имя устройства',
    'products.verfw': 'Версия',
    'products.manual': 'Руководство (pdf)',
    'products.firmware': 'Прошивка (bin)',
    'products.api': 'API (yaml)',
    'products.created': 'Создано',
    'products.updated': 'Обновлено',
    'products.brief': 'Описание',
    'products.description': 'Основные сведения',

    /* ОТВЕТЫ ОТ СЕРВЕРА */
    'ok.dev_delete': 'INFO: Устройство успешно удалено из каталога',
    'ok.dev_delete_version': 'INFO: Версия устройства успешно удалена из каталога',
    'ok.edit_device': 'INFO: Устройство успешно сохранено в каталоге',
    'ok.catalog_list': 'INFO: Данные из каталога успешно получены',
    'ok.catalog_search': 'INFO: Поиск по каталогу успешо выполнен',
    'ok.login': 'INFO: Успешный вход в систему',
    'ok.logout': 'INFO: Успешный выход из системы',
    'ok.token_refresh': 'INFO: Сервер обновил токены доступа',
    'ok.signup': 'INFO: Свяжитесь с администратором для активации аккаунта (15 мин)',
    'ok.delete_user': 'INFO: Аккаунт успешно удален',
    'ok.get_user': 'INFO: Данные о пользователе успешно получены',
    'ok.get_user_list': 'INFO: Список пользователей успешно получен',
    'ok.update_user': 'INFO: Данные пользователя успешно обновлены',
    'ok.user_add_device': 'INFO: Устройство успешно добавлено к пользователю',
    'ok.user_update_device': 'INFO: Устройство успешно обновлено',
    'ok.user_get_device_list': 'INFO: Получен список устройств пользователя',
    'ok.news_list': 'INFO: Список новостей успешно получен',
    'ok.news_delete': 'INFO: Новость успешно удалена',
    'ok.news_add_edit': 'INFO: Работа с новостью успешно завершена',
    'ok.chat_list': 'INFO: Список чатов успешно получен',
    'ok.chat_creation': 'INFO: Чат создан',

    'ok.chat_message_list': 'INFO: Сообщения чата успешно получены',

    'err.unauthorized': 'ERR: Пользователь не авторизован',
    'err.user_token': 'ERR: Неверный токен доступа',
    'err.user_forbidden': 'ERR: Доступ запрещен, недостаточно прав',
    'err.query_data': 'ERR: Запрос с неверными данными',
    'err.dev_not_found': 'ERR: Устройство не найдено',
    'err.dev_delete': 'ERR: Удаление устройства не выполнено',
    'err.dev_data': 'ERR: Недостаточног данных для создания устройства',
    'err.catalog_id': 'ERR: ID устройства не соответствует требованиям',
    'err.catalog_delete_device': 'ERR: Ошибка при удалении устройства',
    'err.file_type': 'ERR: Неверный тип файлов при создании устройства',
    'err.core_file_save': 'ERR: Ошибка при сохранении файла',
    'err.core_file_empty': 'ERR: Файл прошивки пуст',
    'err.core_file_not_found': 'ERR: Файл прошивки не найден',
    'err.edit_device': 'ERR: Устройство не сохранено в каталог',
    'err.catalog_list': 'ERR: Каталог не получен',
    'err.catalog_search': 'ERR: Поиск по каталог не выполнен',
    'err.email': 'ERR: Неверный E-Mail',
    'err.password_length': 'ERR: Пароль должен быть от 6 до 32 символов',
    'err.user_not_found': 'ERR: Пользователь не найден',
    'err.activation_accaunt': 'ERR: Пользователь не активирован, свяжитель с администратором',
    'err.incorrect_password': 'ERR: Неверный пароль',
    'err.token_generator': 'ERR: Сервер не создал токены доступа',
    'err.token_save': 'ERR: Ошибка при сохранении токенов доступа',
    'err.login': 'ERR: Вход в систему невозможен',
    'err.logout': 'ERR: Некорректный выход из системы',
    'err.token_refresh': 'ERR: Сервер не обновил токены доступа',
    'err.creating_account': 'ERR: Ошибка записи в базу данных при создании аккаунта',
    'err.user_exists': 'ERR: Пользователь уже зарегистрирован',
    'err.signup': 'ERR: Аккаунт пользователя не создан',
    'err.device_sn': 'ERR: Неверный серийный номер устройства',
    'err.device_already_added': 'ERR: Устройство уже добавлено',
    'err.device_note_found': 'ERR: Устройство не найдено',
    'err.delete_user': 'ERR: Возникли проблемы при удалении аккаунта',
    'err.get_user': 'ERR: Данные о пользователе не получены',
    'err.get_user_list': 'ERR: Список пользователей не получен',
    'err.update_user': 'ERR: Данные пользователя не обновлены',
    'err.user_add_device': 'ERR: Устройство не добавлено к пользователю',
    'err.user_update_device': 'ERR: Ошибка при обновлении данных об устройстве',
    'err.user_delete_device': 'ERR: Не удалось удалить устройства у пользователя',
    'err.user_device_not_found': 'ERR: Устройство не найдено',
    'err.user_get_device_list': 'ERR: Не удалось получить список устройств пользователя',
    'err.file_not_found': 'ERR: Файл не найден',
    'err.get_file': 'ERR: Ошибка получения файла',
    'err.news_not_found': 'ERR: Новость не найдена',
    'err.news_delete': 'ERR: Ошибка при удалении новости',
    'err.news': 'ERR: Ошибка при работе с новостью',
    'err.body_size_limit': 'ERR: Превышен размер запроса',
    'err.chat_list': 'ERR: Список чатов не получен',
    'err.chat_creation': 'ERR: Ошибка при создании чата',
    'err.chat_creation_chat': 'ERR: Ошибка записи в БД при создании чата',
    'err.chat_exists': 'ERR: Час уже существует',
    'err.catalog_api_parse': 'ERR: Ошибка парсинга файла API',

    'err.chat_id_required': 'ERR: Отсутствует идентификатор чата',
    'err.chat_message_list': 'ERR: Ошибка при получении сообщений',
  },
  en: {},
  zh: {},
}
export default translations

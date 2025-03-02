// $lib/utils/ResponseManager.ts
import { t } from '../locales/i18n'

interface StatusResponse {
  code: number
  messageKey: string
}

/* База ответов, возвращаемых пользователю */
const statusResponse: Record<string, StatusResponse> = {
  OK_LOGIN: { code: 201, messageKey: 'ok.login' },
  ER_USER_UNAUTHORIZED: { code: 401, messageKey: 'err.unauthorized' },

  OK_DELETE_DEVICE_FROM_CATALOG: { code: 200, messageKey: 'ok.dev_delete' },
  OK_EDIT_DEVICE: { code: 200, messageKey: 'ok.edit_device' },
  OK_GET_CATALOG: { code: 200, messageKey: 'ok.catalog_list' },
  OK_CATALOG_SEARCH: { code: 200, messageKey: 'ok.catalog_search' },
  OK_LOGOUT: { code: 200, messageKey: 'ok.logout' },
  OK_REFRESH: { code: 200, messageKey: 'ok.token_refresh' },
  OK_SIGNUP: { code: 200, messageKey: 'ok.signup' },
  OK_DELETE_USER: { code: 200, messageKey: 'ok.delete_user' },
  OK_GET_USER: { code: 200, messageKey: 'ok.get_user' },
  OK_GET_USER_LIST: { code: 200, messageKey: 'ok.get_user_list' },
  OK_USER_UPDATED: { code: 200, messageKey: 'ok.update_user' },
  OK_USER_ADD_DEVICE: { code: 200, messageKey: 'ok.user_add_device' },
  OK_USER_UPDATE_DEVICE: { code: 200, messageKey: 'ok.user_update_device' },
  OK_GET_USER_DEVICE_LIST: { code: 200, messageKey: 'ok.user_get_device_list' },
  OK_NEWS_LIST: { code: 200, messageKey: 'ok.news_list' },
  OK_NEWS_DELETE: { code: 200, messageKey: 'ok.news_delete' },
  OK_NEWS_ADD_EDIT: { code: 200, messageKey: 'ok.news_add_edit' },
  OK_CHAT_LIST: { code: 200, messageKey: 'ok.chat_list' },
  OK_CHAT_CREATION: { code: 200, messageKey: 'ok.chat_creation' },

  OK_MESSAGE_LIST: { code: 200, messageKey: 'ok.chat_message_list' },

  ER_USER_FORBIDDEN: { code: 600, messageKey: 'err.user_forbidden' },
  ER_USER_TOKEN: { code: 600, messageKey: 'err.user_token' },
  ER_QUERY_DATA: { code: 600, messageKey: 'err.query_data' },
  ER_DEVICE_NOT_FOUND_IN_CATALOG: { code: 600, messageKey: 'err.dev_not_found' },
  ER_DELETE_DEVICE_FROM_CATALOG: { code: 600, messageKey: 'err.dev_delete' },
  ER_INSUFFICIENT_DATA_TO_CREATE_DEVICE: { code: 600, messageKey: 'err.dev_data' },
  ER_INVALID_CATALOG_ID: { code: 600, messageKey: 'err.catalog_id' },
  ER_INVALID_FILE_TYPE: { code: 600, messageKey: 'err.file_type' },
  ER_FILE_SAVE: { code: 600, messageKey: 'err.core_file_save' },
  ER_FILE_CORE_EMPTY: { code: 600, messageKey: 'err.core_file_empty' },
  ER_FILE_CORE_NOT_FOUND: { code: 600, messageKey: 'err.core_file_not_found' },
  ER_EDIT_DEVICE: { code: 600, messageKey: 'err.edit_device' },
  ER_GET_CATALOG: { code: 600, messageKey: 'err.catalog_list' },
  ER_CATALOG_SEARCH: { code: 600, messageKey: 'err.catalog_search' },
  ER_EMAIL: { code: 600, messageKey: 'err.email' },
  ER_PASSWORD_LENGTH: { code: 600, messageKey: 'err.password_length' },
  ER_USER_NOT_FOUND: { code: 600, messageKey: 'err.user_not_found' },
  ER_ACTIVATION_ACCOUNT: { code: 600, messageKey: 'err.activation_accaunt' },
  ER_INCORRECT_PASSWORD: { code: 600, messageKey: 'err.incorrect_password' },
  ER_TOKEN_GENERATOR: { code: 600, messageKey: 'err.token_generator' },
  ER_TOKEN_SAVE: { code: 600, messageKey: 'err.token_save' },
  ER_LOGIN: { code: 600, messageKey: 'err.login' },
  ER_LOGOUT: { code: 600, messageKey: 'err.logout' },
  ER_REFRESH: { code: 600, messageKey: 'err.token_refresh' },
  ER_CREATING_ACCOUNT: { code: 600, messageKey: 'err.creating_account' },
  ER_USER_EXISTS: { code: 600, messageKey: 'err.user_exists' },
  ER_SIGNUP: { code: 600, messageKey: 'err.signup' },
  ER_DEV_SN: { code: 600, messageKey: 'err.device_sn' },
  ER_DEVICE_ALREADY_ADDED: { code: 600, messageKey: 'err.device_already_added' },
  ER_DEVICE_NOT_FOUND: { code: 600, messageKey: 'err.device_note_found' },
  ER_DELETE_USER: { code: 600, messageKey: 'err.delete_user' },
  ER_GET_USER: { code: 600, messageKey: 'err.get_user' },
  ER_GET_USER_LIST: { code: 600, messageKey: 'err.get_user_list' },
  ER_USER_UPDATE: { code: 600, messageKey: 'err.update_user' },
  ER_USER_ADD_DEVICE: { code: 600, messageKey: 'err.user_add_device' },
  ER_USER_UPDATE_DEVICE: { code: 600, messageKey: 'err.user_update_device' },
  ER_USER_DELETE_DEVICES: { code: 600, messageKey: 'err.user_delete_device' },
  ER_USER_DEVICE_NOT_FOUND: { code: 600, messageKey: 'err.user_device_not_found' },
  ER_USER_GET_DEVICE_LIST: { code: 600, messageKey: 'err.user_get_device_list' },
  ER_FILE_NOT_FOUND: { code: 600, messageKey: 'err.file_not_found' },
  ER_GET_FILE: { code: 600, messageKey: 'err.get_file' },
  ER_NEWS_NOT_FOUND: { code: 600, messageKey: 'err.news_not_found' },
  ER_NEWS_DELETE: { code: 600, messageKey: 'err.news_delete' },
  ER_NEWS: { code: 600, messageKey: 'err.news' },
  ER_BODY_SIZE_LIMIT: { code: 600, messageKey: 'err.body_size_limit' },
  ER_CHAT_LIST: { code: 600, messageKey: 'err.chat_list' },
  ER_CHAT_CREATION: { code: 600, messageKey: 'err.chat_creation' },
  ER_CREATING_CHAT: { code: 600, messageKey: 'err.chat_creation_chat' },
  ER_CHAT_ALREADY_EXISTS: { code: 600, messageKey: 'err.chat_exists' },
  ER_API_PARSE_ERROR: { code: 600, messageKey: 'err.catalog_api_parse' },

  ER_CHAT_ID_REQUIRED: { code: 600, messageKey: 'err.chat_id_required' },
  ER_MESSAGE_LIST: { code: 600, messageKey: 'err.chat_message_list' },
}

/* Формирователь полного пакета ответа */
export const ResponseManager = (status: string, currentLang: string, customData: object = {}) => {
  const statusData = statusResponse[status] || { code: 600, messageKey: `Unknown Status: ${status}` }
  const message = t(statusData.messageKey, currentLang)
  return { status: { code: statusData.code, message }, ...customData }
}

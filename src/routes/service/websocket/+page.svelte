<!-- src/routes/service/websocket/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { RenderMarkdown } from '$lib/utils/Common'
  import { LoaderStore, WebSocketStore, UserStore, ThemeStore } from '../../../stores'
  import type { IUser, IGroup, IGroupMessage, IOptionUI } from '../../../stores/Interfaces'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import TextArea from '$lib/components/UI/TextArea.svelte'
  import Select from '$lib/components/UI/Select.svelte'
  import UserModal from '$lib/components/UserModal.svelte'
  import IconDelete from '$lib/appIcons/ButtonDelete.svelte'

  let currentLang: string | undefined = $state()
  let UserData: IUser | undefined = $state()
  let currentTheme: string | undefined = $state()
  let groups: IGroup[] | [] | undefined = $state([])
  let selectedGroup: IOptionUI | null = $state(null)
  let newMessage: string = $state('')
  let groupName: string = $state('')
  let Cursor: string | null = $state(null)
  let MessageList: IGroupMessage[] = $state([])
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value)),
      User: UserStore.subscribe((value) => (UserData = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      WebSocket: WebSocketStore.subscribe((state) => {
        groups = state.groupList.map((group) => ({
          GroupID: group.GroupID,
          GroupName: group.GroupName ?? '',
          FirstName: group.FirstName ?? '',
          LastName: group.LastName ?? '',
          Created: group.Created,
          Updated: group.Updated,
        }))
        /* Проверяем, выбранная ли группа и получаем сообщения */
        if (selectedGroup) {
          const rawMessages = state.valueContent.get(selectedGroup.id) || []
          MessageList = rawMessages.map((msg: IGroupMessage) => ({
            ClientID: msg.ClientID || '',
            DevSN: msg.DevSN || '',
            GroupID: selectedGroup?.id || '',
            MessageID: msg.MessageID,
            Message: msg.Message,
            Created: msg.Created,
            Author: {
              UserID: msg.Author?.UserID || '',
              NickName: msg.Author?.NickName || '',
              FirstName: msg.Author?.FirstName || '',
              LastName: msg.Author?.LastName || '',
            },
          })) as IGroupMessage[]

          /* Проверка наличия сообщений в группе */
          const lastResponse = state.lastResponse
          if (lastResponse && lastResponse.HEADER === 'OK!' && lastResponse.ARGUMENT === 'GroupMessages' && 'HasMore' in lastResponse.VALUE) {
            hasMoreMessages = Boolean(lastResponse.VALUE.HasMore) || false
          }

          /* Рендер сообщений */
          renderAllMessage()
        }
      }),
    }

    /* Установить группу по умолчанию в Select */
    const defaultGroup = groups?.find((group) => group.GroupName === UserData?.UserID)
    if (defaultGroup) {
      selectedGroup = {
        id: defaultGroup.GroupID,
        name: defaultGroup.GroupName === UserData?.UserID ? t('group.personal', currentLang) : t('group.error_personal', currentLang),
        color: currentTheme === 'light' ? 'bg-yellow-200 !border-yellow-200' : 'bg-yellow-800 !border-yellow-800',
      }
    }

    /* Запросить список всех групп на сервере */
    getGroups()

    /* Получаем список сообщений */
    getMessages()

    /* Функция для очистки подписок */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* Запросить список всех групп с сервера */
  const getGroups = () => {
    if (UserData?.UserID && selectedGroup?.id) {
      WebSocketStore.sendPacket('SYS', 'GroupList', { ClientID: UserData.UserID, GroupID: selectedGroup.id })
    } else {
      console.error('Не установлен UserData или selectedGroup')
    }
  }

  /* Присоединение к группе */
  const joinToGroup = (value: IOptionUI | null) => {
    if (UserData && value) {
      selectedGroup = value
      WebSocketStore.sendPacket('SYS', 'JoinGroup', { ClientID: UserData.UserID, GroupID: selectedGroup.id })
      getMessages()
    } else {
      console.error('Не установлен UserData или value для joinToGroup')
    }
  }

  /* Создать чат */
  const createGroup = () => {
    LoaderStore.set(true)
    if (groupName.trim() && UserData?.UserID) {
      WebSocketStore.sendPacket('SYS', 'CreateGroup', {
        ClientID: UserData.UserID,
        GroupName: groupName,
      })
      groupName = ''
    }
    LoaderStore.set(false)
  }

  /* Удалить группу */
  const deleteGroup = (GroupID: string) => {
    if (UserData) {
      WebSocketStore.sendPacket('SYS', 'DeleteGroup', { ClientID: UserData.UserID, GroupID })
    }
  }

  /* Отправка сообщения в чат */
  const sendPacket = () => {
    if (newMessage.trim() && UserData?.UserID && selectedGroup) {
      WebSocketStore.sendPacket('SET', 'GroupMessage', {
        ClientID: UserData.UserID,
        GroupID: selectedGroup.id,
        Message: newMessage,
      })
      newMessage = ''
    }
  }

  /* Получить пакет сообщений из группы с пагинацией */
  let hasMoreMessages: boolean = false
  let container: HTMLElement | null = $state(null)
  const getMessages = () => {
    if (UserData?.UserID && selectedGroup) {
      WebSocketStore.sendPacket('GET', 'GroupMessages', {
        ClientID: UserData.UserID,
        GroupID: selectedGroup.id,
        Cursor,
      })
    } else {
      console.warn('UserData или selectedGroup не установлены')
    }
  }

  const loadMoreMessages = () => {
    if (selectedGroup && hasMoreMessages) {
      const firstMessageID = (MessageList[MessageList.length - 1] as IGroupMessage).MessageID
      Cursor = firstMessageID !== undefined && firstMessageID !== null ? String(firstMessageID) : null
      getMessages()
    }
  }

  function handleScroll() {
    if (container) {
      const { scrollTop, clientHeight, scrollHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 50 && hasMoreMessages) {
        loadMoreMessages()
        hasMoreMessages = false
      }
    }
  }

  /* Удалить сообщение */
  const deleteMessage = (MessageID: string) => {
    if (UserData && MessageID) {
      WebSocketStore.sendPacket('SET', 'DeleteMessage', {
        ClientID: UserData.UserID,
        GroupID: selectedGroup?.id,
        MessageID,
      })
    }
  }

  /* Прогон сообщений через парсер MD */
  let renderedContents: string[] = $state([])
  const renderAllMessage = async () => {
    try {
      renderedContents = await Promise.all(
        MessageList.map(async (message) => {
          if (typeof message.Message === 'string' && message.Message.trim() !== '') {
            return await RenderMarkdown(message.Message)
          } else {
            return '<p>Сообщение отсутствует</p>'
          }
        }),
      )
    } catch (error) {
      console.error('Ошибка при рендеринге Markdown:', error)
      renderedContents = renderedContents.map(() => '<p>Ошибка при рендеринге содержимого.</p>')
    }
  }

  /* Управление модальным окном для вывода информации об авторе сообщения */
  let showModal = $state(false)
  let selectedUserID: string = $state('')
  const openModal = (UserID: string) => {
    selectedUserID = UserID
    showModal = true
  }
</script>

<!-- Разметка компонента -->
{#if currentLang}
  <div class="flex h-full flex-col items-center overflow-hidden">
    <h2>{t('service.websocket.title', currentLang)}</h2>
    <!-- Блок работы с группами (обновить список, выбрать и подключиться, обновить сообщения) -->
    <div class="m-2 flex w-full flex-row flex-nowrap items-center justify-center p-2">
      {#if groups}
        <Select
          options={groups.map((group) => ({
            id: group.GroupID,
            name:
              group.GroupName === UserData?.UserID
                ? t('group.personal', currentLang)
                : group.FirstName && group.LastName
                  ? `${group.FirstName} ${group.LastName}`
                  : (group.GroupName ?? 'Group without Name'),
            color:
              group.GroupName === UserData?.UserID
                ? currentTheme === 'light'
                  ? 'bg-yellow-200 !border-yellow-200'
                  : 'bg-yellow-800 !border-yellow-800'
                : currentTheme === 'light'
                  ? 'bg-lime-200 !border-lime-200'
                  : 'bg-lime-800 !border-lime-800',
          }))}
          value={selectedGroup}
          onUpdate={(value: IOptionUI | null) => joinToGroup(value)}
          className="mx-4 w-2/3"
          props={{ currentLang: currentLang }}
        />
      {/if}
      <Button
        label={'Получить сообщения'}
        props={{ bgColor: currentTheme === 'light' ? 'bg-lime-200' : 'bg-lime-800' }}
        onClick={getMessages}
        className="w-60 rounded-2xl"
      />
    </div>

    <!-- Блок создания группы -->
    <div class="m-2 flex w-full flex-row flex-nowrap items-center justify-center p-2">
      <Input id="InputChatName" props={{ autocomplete: 'on', maxLength: 32 }} className="flex-grow w-full m-1 border" bind:value={groupName} />
      <Button
        onClick={createGroup}
        label={t('common.create', currentLang)}
        props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800' }}
        className="m-1 w-48 rounded-2xl"
      />
    </div>

    <!-- Кнопки для удаления групп -->
    <h3>Удалить группу</h3>
    <div class="m-2 flex w-full flex-wrap items-center justify-center">
      {#if groups}
        {#each groups as group}
          <Button
            onClick={() => deleteGroup(group.GroupID)}
            label={group.GroupName === UserData?.UserID
              ? t('group.personal', currentLang)
              : group.FirstName && group.LastName
                ? `${group.FirstName} ${group.LastName}`
                : (group.GroupName ?? 'Group without Name')}
            props={{
              bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
              disabled: group.GroupName === 'System' || group.GroupName === UserData?.UserID,
            }}
            className="m-1 rounded-2xl min-w-24"
          />
        {/each}
      {/if}
    </div>

    <!-- Блок создания сообщения и отправки -->
    <div class="m-2 flex w-full flex-row flex-nowrap items-center justify-center p-2">
      <TextArea
        id="InputGroupMessage"
        props={{ maxLength: 4096, rows: 4 }}
        className="flex-grow w-full m-2 border text-justify"
        bind:value={newMessage}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault()
            sendPacket()
          }
        }}
      />
      <Button
        onClick={sendPacket}
        label={t('common.send', currentLang)}
        props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800' }}
        className="m-2 w-36 h-14 rounded-2xl"
      />
    </div>

    <!-- Блок всех сообщений -->
    <div class="flex h-full w-full flex-1 flex-col overflow-y-auto" id="messageContainer" onscroll={handleScroll} bind:this={container}>
      {#each MessageList as message, index}
        <div
          class={`relative m-2 flex flex-col rounded-2xl border
          ${(message as IGroupMessage).Author?.UserID === UserData?.UserID ? 'items-end text-right' : 'items-start text-left'}
          ${currentTheme === 'light' ? 'bg-yellow-100' : 'bg-yellow-700'}`}
        >
          <!-- Заголовок сообщения (автор, дата, кнопка удаления) -->
          <div class={`mb-2 flex w-full flex-row items-center justify-center border-b`}>
            <Button
              className={`mx-2 border-0 rounded-2xl`}
              onClick={() => {
                const userId = (message as IGroupMessage).Author?.UserID
                if (userId) {
                  openModal(`${userId}`)
                }
              }}
              props={{
                disabled: !(message as IGroupMessage).Author?.UserID,
              }}
              label={(message as IGroupMessage).Author?.UserID
                ? `${(message as IGroupMessage).Author?.FirstName} ${(message as IGroupMessage).Author?.LastName}`
                : (message as IGroupMessage).ClientID}
            />
            <p>{(message as IGroupMessage).Created}</p>
            <Button
              onClick={() => {
                const messageId = (message as IGroupMessage)?.MessageID
                if (messageId) {
                  deleteMessage(messageId)
                }
              }}
              props={{ bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-900' }}
              className="absolute right-0 top-0 border-0 rounded-none rounded-tr-2xl"
              icon={IconDelete}
              iconProps={{ width: '1.5rem', height: '1.5rem' }}
            />
          </div>

          <!-- Сообщение -->
          <div
            class={`whitespace-wrap flex w-full flex-row overflow-hidden p-2 text-ellipsis
              ${(message as IGroupMessage).Author?.UserID === UserData?.UserID ? 'justify-end' : 'justify-start'}
            `}
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html renderedContents[index]}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if showModal}
  <UserModal
    UserID={selectedUserID}
    onClose={() => {
      showModal = false
    }}
  />
{/if}

<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import type { IWebSocketPacket, IOptionUI } from '../../stores/Interfaces'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'
  import ColorPicker from '$lib/components/UI/ColorPicker.svelte'
  import Switch from '$lib/components/UI/Switch.svelte'

  import Accordion from '$lib/UILibrary/Accordion.svelte'
  import UIInput from '$lib/UILibrary/Input.svelte'
  import UiIcon from '$lib/appIcons/UiIcon.svelte'
  import Separator from '$lib/UILibrary/Separator.svelte'
  import UISlider from '$lib/UILibrary/Slider.svelte'
  import FileInput from '$lib/UILibrary/FileInput.svelte'
  import Select from '$lib/UILibrary/Select.svelte'
  import UISwitch from '$lib/UILibrary/Switch.svelte'
  import type { Colors, IOption } from '$lib/UILibrary/Interface'
  import Graph from '$lib/UILibrary/Graph.svelte'
  import UIColorPicker from '$lib/UILibrary/ColorPicker.svelte'
  import UIButton from '$lib/UILibrary/Button.svelte'
  import Table, { type ITableColumn } from '$lib/UILibrary/Table.svelte'

  const wifiModeList: IOption[] = [
    { id: 1, name: 'Станция' },
    { id: 2, name: 'Точка доступа' },
    { id: 3, name: 'Гибрид', color: 'amber' },
  ]

  const accessPoints: IOption[] = [
    { id: 1, name: 'point1' },
    { id: 2, name: 'point2' },
    { id: 3, name: 'point3' },
    { id: 4, name: 'point4' },
    { id: 5, name: 'point5' },
  ]
  let ap: IOption = $state(accessPoints[0])

  let selectValue: IOption = $state(wifiModeList[0])
  let buttonItem: IOption = $state(wifiModeList[2])
  let inputString = $state('')
  let inputNumber = $state(4)
  let counter = $state(0)

  let sliderValue: number | [number, number] = $state(12)
  let text = $state(
    'Проблема в том, что груз задачи мешает работать. Мы ведь понимаем, что это надолго. А большую задачу делать не хочется... ' +
      'Поэтому мы ее откладываем, беремся за задачи поменьше. В итоге да, день прошел, а мы не успели закончить. ' +
      'А если не тратить время на размышления «сколько времени это у меня займет», а сосредоточиться на конкретной задаче (в данном случае — ' +
      'первом письме из стопки, потом втором...), то не успеете оглянуться, как уже всё разгребли!',
  )

  function clickItem(id: string) {
    console.log(id)
  }

  // данные для таблицы - массив колонок и строк
  //интерфейс для строки - в таблицу передается желаемый массив объектов
  interface Device {
    id: string
    name: string
    status: 'online' | 'offline'
    lastActive: Date
    action?: string
    imageUrl: string
  }

  const rows: Device[] = [
    {
      id: '# 1',
      name: 'Device A',
      status: 'online',
      lastActive: new Date(),
      imageUrl:
        'data:image/svg+xml;base64,PHN2ZyBiYXNlUHJvZmlsZT0iZnVsbCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNTIxIiBoZWlnaHQ9IjQ3NyI+DQo8ZGVmcz4NCjxzdHlsZT5jaXJjbGUscGF0aCxwb2x5bGluZXtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmR9PC9zdHlsZT4NCjwvZGVmcz4NCjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzc3NyIgc3Ryb2tlLXdpZHRoPSIxMCIgZD0iTTExNi42MyAxODguNjJsODMgNTIiLz4NCjxjaXJjbGUgY3g9Ijg0LjgzIiBjeT0iMTY4LjgzIiByPSIzNi44MyIgZmlsbD0iIzIyMiIgc3Ryb2tlPSIjNzc3IiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiM3NzciIHN0cm9rZS13aWR0aD0iMTAiIGQ9Ik00MDkuMDMgMzgwLjAzbC04My01MiIvPg0KPGNpcmNsZSBjeD0iNDQwLjgzIiBjeT0iMzk5LjgzIiByPSIzNi44MyIgZmlsbD0iIzIyMiIgc3Ryb2tlPSIjNzc3IiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiM1OUYiIHN0cm9rZS13aWR0aD0iMTAiIGQ9Ik0xMTIuMDMgMzc5LjAzbDgzLTUyTTI2Mi4wMyAyMDQuMDN2LTg4Ii8+DQo8Y2lyY2xlIGN4PSIyNjEuMzMiIGN5PSIyODQuMzMiIHI9Ijc4LjMzIiBmaWxsPSIjZmZmIiBzdHJva2U9IiM1OUYiIHN0cm9rZS13aWR0aD0iMTUiLz4NCjxjaXJjbGUgY3g9Ijc2LjgzIiBjeT0iMzk5LjgzIiByPSIzNi44MyIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjNTlGIiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8Y2lyY2xlIGN4PSIyNjAuODMiIGN5PSI3Ni44MyIgcj0iMzYuODMiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzU5RiIgc3Ryb2tlLXdpZHRoPSIxMCIvPg0KPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTlGIiBzdHJva2Utd2lkdGg9IjEwIiBkPSJNNDY1IDM0MEM1MTMgMTQyIDMyOSA3OSAzMjkgNzlNNDI3IDMzMWM0MC0xNjItMTEwLTIxMy0xMTAtMjEzTTM4OSAzMTljMzEtMTI1LTg2LTE2NS04Ni0xNjUiLz4NCjwvc3ZnPg==',
    },
    {
      id: '# 2',
      name: 'Device B',
      status: 'offline',
      lastActive: new Date(Date.now() - 86400000 * 4),
      imageUrl:
        'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8c3ZnDQogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iDQogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIg0KICAgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIg0KICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyINCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyINCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCINCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIg0KICAgaWQ9InN2ZzgiDQogICB2ZXJzaW9uPSIxLjEiDQogICB2aWV3Qm94PSIwIDAgMTMuMjI5MTY2IDEzLjIyOTE2NiINCiAgIGhlaWdodD0iMTMuMjI5MTY2bW0iDQogICB3aWR0aD0iMTMuMjI5MTY2bW0iDQogICBzb2RpcG9kaTpkb2NuYW1lPSJNdWx0aSBTd2l0Y2ggdjEyLnN2ZyINCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTIuMSByMTUzNzEiDQogICBpbmtzY2FwZTpleHBvcnQtZmlsZW5hbWU9IkQ6XGFud29ya1zQmNC60L7QvdC60Lgg0YPRgdGC0YDQvtC50YHRgtCyXE11bHRpIFN3aXRjaCB2MTEucG5nIg0KICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjIzMC40MDAwMSINCiAgIGlua3NjYXBlOmV4cG9ydC15ZHBpPSIyMzAuNDAwMDEiPg0KICA8c29kaXBvZGk6bmFtZWR2aWV3DQogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiINCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiDQogICAgIGJvcmRlcm9wYWNpdHk9IjEiDQogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiDQogICAgIGdyaWR0b2xlcmFuY2U9IjEwIg0KICAgICBndWlkZXRvbGVyYW5jZT0iMTAiDQogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIg0KICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIg0KICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiDQogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMTciDQogICAgIGlkPSJuYW1lZHZpZXcxOSINCiAgICAgc2hvd2dyaWQ9ImZhbHNlIg0KICAgICBpbmtzY2FwZTp6b29tPSIxMy4zNTAxNzciDQogICAgIGlua3NjYXBlOmN4PSI3LjkyNjAxMDYiDQogICAgIGlua3NjYXBlOmN5PSIyMi41NjgwMjIiDQogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCINCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii04Ig0KICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIg0KICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmc4IiAvPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczIiPg0KICAgIDxtYXJrZXINCiAgICAgICBpbmtzY2FwZTpzdG9ja2lkPSJFbXB0eVRyaWFuZ2xlT3V0TSINCiAgICAgICBvcmllbnQ9ImF1dG8iDQogICAgICAgcmVmWT0iMC4wIg0KICAgICAgIHJlZlg9IjAuMCINCiAgICAgICBpZD0ibWFya2VyNTQ3NSINCiAgICAgICBzdHlsZT0ib3ZlcmZsb3c6dmlzaWJsZSINCiAgICAgICBpbmtzY2FwZTppc3N0b2NrPSJ0cnVlIj4NCiAgICAgIDxwYXRoDQogICAgICAgICBpZD0icGF0aDU0NzMiDQogICAgICAgICBkPSJNIDUuNzcsMC4wIEwgLTIuODgsNS4wIEwgLTIuODgsLTUuMCBMIDUuNzcsMC4wIHogIg0KICAgICAgICAgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2ZpbGw6I2ZmZmZmZjtzdHJva2U6Izc3Nzc3NztzdHJva2Utd2lkdGg6MXB0O3N0cm9rZS1vcGFjaXR5OjEiDQogICAgICAgICB0cmFuc2Zvcm09InNjYWxlKDAuNCkgdHJhbnNsYXRlKC00LjUsMCkiIC8+DQogICAgPC9tYXJrZXI+DQogICAgPG1hcmtlcg0KICAgICAgIGlua3NjYXBlOmlzc3RvY2s9InRydWUiDQogICAgICAgc3R5bGU9Im92ZXJmbG93OnZpc2libGUiDQogICAgICAgaWQ9Im1hcmtlcjUxMTEiDQogICAgICAgcmVmWD0iMC4wIg0KICAgICAgIHJlZlk9IjAuMCINCiAgICAgICBvcmllbnQ9ImF1dG8iDQogICAgICAgaW5rc2NhcGU6c3RvY2tpZD0iRW1wdHlUcmlhbmdsZU91dE0iPg0KICAgICAgPHBhdGgNCiAgICAgICAgIHRyYW5zZm9ybT0ic2NhbGUoMC40KSB0cmFuc2xhdGUoLTQuNSwwKSINCiAgICAgICAgIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOiM3Nzc3Nzc7c3Ryb2tlOiM3Nzc3Nzc7c3Ryb2tlLXdpZHRoOjFwdDtzdHJva2Utb3BhY2l0eToxO2ZpbGwtb3BhY2l0eToxIg0KICAgICAgICAgZD0iTSA1Ljc3LDAuMCBMIC0yLjg4LDUuMCBMIC0yLjg4LC01LjAgTCA1Ljc3LDAuMCB6ICINCiAgICAgICAgIGlkPSJwYXRoNTEwOSIgLz4NCiAgICA8L21hcmtlcj4NCiAgICA8bWFya2VyDQogICAgICAgaW5rc2NhcGU6c3RvY2tpZD0iRW1wdHlUcmlhbmdsZU91dE0iDQogICAgICAgb3JpZW50PSJhdXRvIg0KICAgICAgIHJlZlk9IjAuMCINCiAgICAgICByZWZYPSIwLjAiDQogICAgICAgaWQ9IkVtcHR5VHJpYW5nbGVPdXRNIg0KICAgICAgIHN0eWxlPSJvdmVyZmxvdzp2aXNpYmxlIg0KICAgICAgIGlua3NjYXBlOmlzc3RvY2s9InRydWUiDQogICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIj4NCiAgICAgIDxwYXRoDQogICAgICAgICBpZD0icGF0aDQ5NzYiDQogICAgICAgICBkPSJNIDUuNzcsMC4wIEwgLTIuODgsNS4wIEwgLTIuODgsLTUuMCBMIDUuNzcsMC4wIHogIg0KICAgICAgICAgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2ZpbGw6Izc3Nzc3NztzdHJva2U6Izc3Nzc3NztzdHJva2Utd2lkdGg6MXB0O3N0cm9rZS1vcGFjaXR5OjE7ZmlsbC1vcGFjaXR5OjEiDQogICAgICAgICB0cmFuc2Zvcm09InNjYWxlKDAuNCkgdHJhbnNsYXRlKC00LjUsMCkiIC8+DQogICAgPC9tYXJrZXI+DQogICAgPGxpbmVhckdyYWRpZW50DQogICAgICAgaWQ9ImEiPg0KICAgICAgPHN0b3ANCiAgICAgICAgIGlkPSJzdG9wMTAiDQogICAgICAgICBzdG9wLWNvbG9yPSIjZDllYzAwIg0KICAgICAgICAgb2Zmc2V0PSIwIiAvPg0KICAgICAgPHN0b3ANCiAgICAgICAgIGlkPSJzdG9wMTIiDQogICAgICAgICBzdG9wLW9wYWNpdHk9IjAiDQogICAgICAgICBzdG9wLWNvbG9yPSIjZjdmZjk4Ig0KICAgICAgICAgb2Zmc2V0PSIxIiAvPg0KICAgIDwvbGluZWFyR3JhZGllbnQ+DQogIDwvZGVmcz4NCiAgPG1ldGFkYXRhDQogICAgIGlkPSJtZXRhZGF0YTUiPg0KICAgIDxyZGY6UkRGPg0KICAgICAgPGNjOldvcmsNCiAgICAgICAgIHJkZjphYm91dD0iIj4NCiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+DQogICAgICAgIDxkYzp0eXBlDQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+DQogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPg0KICAgICAgPC9jYzpXb3JrPg0KICAgIDwvcmRmOlJERj4NCiAgPC9tZXRhZGF0YT4NCiAgPGNpcmNsZQ0KICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6bm9uZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6I2UwNjY2NjtzdHJva2Utd2lkdGg6MC43OTM3NTAwNTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MTtwYWludC1vcmRlcjpzdHJva2UgZmlsbCBtYXJrZXJzIg0KICAgICBpZD0icGF0aDQ1MTYiDQogICAgIGN4PSI2LjYxNDU4MyINCiAgICAgY3k9IjYuNjE0NTgzIg0KICAgICByPSI2LjIxNzcwODYiDQogICAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSIyMzAuMzk5OTkiDQogICAgIGlua3NjYXBlOmV4cG9ydC15ZHBpPSIyMzAuMzk5OTkiIC8+DQogIDxjaXJjbGUNCiAgICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjIzMC4zOTk5OSINCiAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjIzMC4zOTk5OSINCiAgICAgcj0iNi41NDg0Mzc2Ig0KICAgICBjeT0iNi42MTQ1ODMiDQogICAgIGN4PSI2LjYxNDU4MyINCiAgICAgaWQ9ImNpcmNsZTQ0OTUiDQogICAgIHN0eWxlPSJvcGFjaXR5OjE7ZmlsbDpub25lO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojNTU1NTU1O3N0cm9rZS13aWR0aDowLjEzMjI5MTY3O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxO3BhaW50LW9yZGVyOnN0cm9rZSBmaWxsIG1hcmtlcnMiIC8+DQogIDxwYXRoDQogICAgIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNlMDY2NjY7c3Ryb2tlLXdpZHRoOjAuNjYxNDU4Mzc7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiDQogICAgIGQ9Ik0gNi41NjgyNjEsMy43NjYxNzA2IFYgNi42MDQyMzQyIg0KICAgICBpZD0icGF0aDQ1MzEtOSINCiAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCINCiAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjIzMC40MDAwMSINCiAgICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjIzMC40MDAwMSIgLz4NCiAgPHBhdGgNCiAgICAgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2UwNjY2NjtzdHJva2Utd2lkdGg6MC42NjE0NTgzNztzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSINCiAgICAgZD0iTSA5LjQ1NDY5Nyw2LjYwNDIzNDIgSCA2LjU2ODI2MSINCiAgICAgaWQ9InBhdGg0NTM3Ig0KICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIg0KICAgICBpbmtzY2FwZTpleHBvcnQteGRwaT0iMjMwLjQwMDAxIg0KICAgICBpbmtzY2FwZTpleHBvcnQteWRwaT0iMjMwLjQwMDAxIiAvPg0KICA8cmVjdA0KICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2UwNjY2NjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6Izc3Nzc3NztzdHJva2Utd2lkdGg6MC41MjkxNjY2ODtzdHJva2UtbGluZWNhcDpzcXVhcmU7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjE7cGFpbnQtb3JkZXI6c3Ryb2tlIGZpbGwgbWFya2VycyINCiAgICAgaWQ9InJlY3Q0NTIyIg0KICAgICB3aWR0aD0iMS4zNjc0OTEyIg0KICAgICBoZWlnaHQ9IjEuMzY3NDkxMiINCiAgICAgeD0iOC44MzE3MjUxIg0KICAgICB5PSI4LjkxMTA0MTMiDQogICAgIHJ4PSIwLjIzODIzNzExIg0KICAgICByeT0iMC4yMzgyMzcxMSIgLz4NCiAgPHJlY3QNCiAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOm5vbmU7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM3Nzc3Nzc7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzMzU7c3Ryb2tlLWxpbmVjYXA6c3F1YXJlO3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxO3BhaW50LW9yZGVyOnN0cm9rZSBmaWxsIG1hcmtlcnMiDQogICAgIGlkPSJyZWN0NTk4MiINCiAgICAgd2lkdGg9IjEuNTkxNzE0NCINCiAgICAgaGVpZ2h0PSIxLjU5MTcxNDQiDQogICAgIHg9IjIuODYwNDYxNyINCiAgICAgeT0iMi45MTk3MzI2Ig0KICAgICByeD0iMC4yOTQyOTI5Ig0KICAgICByeT0iMC4yOTQyOTI5IiAvPg0KICA8cGF0aA0KICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6bm9uZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6Izc3Nzc3NztzdHJva2Utd2lkdGg6MC4yNjQ1ODMzNTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MTttYXJrZXItZW5kOnVybCgjRW1wdHlUcmlhbmdsZU91dE0pO3BhaW50LW9yZGVyOnN0cm9rZSBmaWxsIG1hcmtlcnMiDQogICAgIGlkPSJjaXJjbGU0ODExIg0KICAgICBpbmtzY2FwZTpleHBvcnQteGRwaT0iMjMwLjM5OTk5Ig0KICAgICBpbmtzY2FwZTpleHBvcnQteWRwaT0iMjMwLjM5OTk5Ig0KICAgICBzb2RpcG9kaTp0eXBlPSJhcmMiDQogICAgIHNvZGlwb2RpOmN4PSI2LjYxNDU4MyINCiAgICAgc29kaXBvZGk6Y3k9IjYuNjE0NTgzIg0KICAgICBzb2RpcG9kaTpyeD0iNC4zNjIyNjE4Ig0KICAgICBzb2RpcG9kaTpyeT0iNC4zNjIyNjE4Ig0KICAgICBzb2RpcG9kaTpzdGFydD0iNC4zNDIxMDgxIg0KICAgICBzb2RpcG9kaTplbmQ9IjAuMzYzODY3MTIiDQogICAgIHNvZGlwb2RpOm9wZW49InRydWUiDQogICAgIGQ9Ik0gNS4wMzU5Nzk1LDIuNTQ3OTcwMyBBIDQuMzYyMjYxOCw0LjM2MjI2MTggMCAwIDEgOS42ODkyNjAyLDMuNTIwMTIyMSA0LjM2MjI2MTgsNC4zNjIyNjE4IDAgMCAxIDEwLjY5MTIzNyw4LjE2NzA3MTkiIC8+DQogIDxwYXRoDQogICAgIGQ9Im0gLTguMTY2NjMwMSwtMTAuODQ3NDU5IGEgNC4zNjIyNjE4LDQuMzYyMjYxOCAwIDAgMSA0LjYyNTg1ODYsMS4wMDU3MDM5IDQuMzYyMjYxOCw0LjM2MjI2MTggMCAwIDEgMC45ODUyNjUxLDQuNjMwMjU1Ig0KICAgICBzb2RpcG9kaTpvcGVuPSJ0cnVlIg0KICAgICBzb2RpcG9kaTplbmQ9IjAuMzYzODY3MTIiDQogICAgIHNvZGlwb2RpOnN0YXJ0PSI0LjM1MjkzODIiDQogICAgIHNvZGlwb2RpOnJ5PSI0LjM2MjI2MTgiDQogICAgIHNvZGlwb2RpOnJ4PSI0LjM2MjI2MTgiDQogICAgIHNvZGlwb2RpOmN5PSItNi43NjM5ODkiDQogICAgIHNvZGlwb2RpOmN4PSItNi42MzIxNjAyIg0KICAgICBzb2RpcG9kaTp0eXBlPSJhcmMiDQogICAgIGlua3NjYXBlOmV4cG9ydC15ZHBpPSIyMzAuMzk5OTkiDQogICAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSIyMzAuMzk5OTkiDQogICAgIGlkPSJwYXRoNTEwNyINCiAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOm5vbmU7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM3Nzc3Nzc7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzMzU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjE7bWFya2VyLWVuZDp1cmwoI21hcmtlcjUxMTEpO3BhaW50LW9yZGVyOnN0cm9rZSBmaWxsIG1hcmtlcnMiDQogICAgIHRyYW5zZm9ybT0ic2NhbGUoLTEpIiAvPg0KPC9zdmc+DQo=',
    },
    {
      id: '# 3',
      name: 'Device C',
      status: 'offline',
      lastActive: new Date(Date.now() - 86400000),
      imageUrl:
        'data:image/svg+xml;base64,PHN2ZyBiYXNlUHJvZmlsZT0iZnVsbCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNTIxIiBoZWlnaHQ9IjQ3NyI+DQo8ZGVmcz4NCjxzdHlsZT5jaXJjbGUscGF0aCxwb2x5bGluZXtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmR9PC9zdHlsZT4NCjwvZGVmcz4NCjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzc3NyIgc3Ryb2tlLXdpZHRoPSIxMCIgZD0iTTExNi42MyAxODguNjJsODMgNTIiLz4NCjxjaXJjbGUgY3g9Ijg0LjgzIiBjeT0iMTY4LjgzIiByPSIzNi44MyIgZmlsbD0iIzIyMiIgc3Ryb2tlPSIjNzc3IiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiM3NzciIHN0cm9rZS13aWR0aD0iMTAiIGQ9Ik00MDkuMDMgMzgwLjAzbC04My01MiIvPg0KPGNpcmNsZSBjeD0iNDQwLjgzIiBjeT0iMzk5LjgzIiByPSIzNi44MyIgZmlsbD0iIzIyMiIgc3Ryb2tlPSIjNzc3IiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiM1OUYiIHN0cm9rZS13aWR0aD0iMTAiIGQ9Ik0xMTIuMDMgMzc5LjAzbDgzLTUyTTI2Mi4wMyAyMDQuMDN2LTg4Ii8+DQo8Y2lyY2xlIGN4PSIyNjEuMzMiIGN5PSIyODQuMzMiIHI9Ijc4LjMzIiBmaWxsPSIjZmZmIiBzdHJva2U9IiM1OUYiIHN0cm9rZS13aWR0aD0iMTUiLz4NCjxjaXJjbGUgY3g9Ijc2LjgzIiBjeT0iMzk5LjgzIiByPSIzNi44MyIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjNTlGIiBzdHJva2Utd2lkdGg9IjEwIi8+DQo8Y2lyY2xlIGN4PSIyNjAuODMiIGN5PSI3Ni44MyIgcj0iMzYuODMiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzU5RiIgc3Ryb2tlLXdpZHRoPSIxMCIvPg0KPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTlGIiBzdHJva2Utd2lkdGg9IjEwIiBkPSJNNDY1IDM0MEM1MTMgMTQyIDMyOSA3OSAzMjkgNzlNNDI3IDMzMWM0MC0xNjItMTEwLTIxMy0xMTAtMjEzTTM4OSAzMTljMzEtMTI1LTg2LTE2NS04Ni0xNjUiLz4NCjwvc3ZnPg==',
    },
  ]

  // определяем вид колонок - заголовок, ключ из интерфейса строки и содержимое
  const columns: ITableColumn<Device>[] = [
    { label: 'ID', key: 'id', width: '10%' },
    {
      label: 'Image',
      key: 'imageUrl',
      image: {
        src: (row: Device) => row.imageUrl,
        alt: (row: Device) => row.name,
        width: '50px',
        height: '50px',
      },
      width: '130px',
    },
    { label: 'Name', key: 'name', sortable: true },
    {
      label: 'Status',
      key: 'status',
      formatter: (value: string) => (value === 'online' ? '🟢 Online' : '🔴 Offline'),
    },
    {
      label: 'Last Active',
      key: 'lastActive',
      sortable: true,
      formatter: (value: { toLocaleDateString: () => any }) => value.toLocaleDateString(),
    },
    {
      label: 'Actions',
      key: 'action',
      buttons: [
        {
          text: 'Log id',
          color: 'red',
          onClick: (row) => clickItem(row.id),
        },
        {
          text: 'Log name',
          color: 'green',
          onClick: (row) => clickItem(row.name),
        },
      ],
    },
  ]

  // генерация данных для графика
  const generateSmoothData = () => {
    let y = 0
    const data = []

    for (let x = 0; x < 100; x++) {
      y = 2 * Math.sin(x / 10) + Math.random() * 2
      data.push({ x, y })
    }

    return data
  }

  const data = generateSmoothData()

  import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'
  import { DEFAULT_TAGS } from '../../enums'

  const RadioGroupOption = [
    { id: 'tag-1', name: 'Tag 1', color: 'bg-stone-400 border-2 !border-stone-400' },
    { id: 'tag-2', name: 'Tag 2', color: 'bg-red-400 border-2 !border-red-400' },
    { id: 'tag-3', name: 'Tag 3', color: 'bg-orange-400 border-2 !border-orange-400' },
    { id: 'tag-4', name: 'Tag 4', color: 'bg-amber-400 border-2 !border-amber-400' },
    { id: 'tag-5', name: 'Tag 5', color: 'bg-yellow-400 border-2 !border-yellow-400' },
    { id: 'tag-6', name: 'Tag 6', color: 'bg-lime-400 border-2 !border-lime-400' },
    { id: 'tag-7', name: 'Tag 7', color: 'bg-green-400 border-2 !border-green-400' },
    { id: 'tag-8', name: 'Tag 8', color: 'bg-emerald-400 border-2 !border-emerald-400' },
    { id: 'tag-9', name: 'Tag 9', color: 'bg-teal-400 border-2 !border-teal-400' },
    { id: 'tag-10', name: 'Tag 10', color: 'bg-cyan-400 border-2 !border-cyan-400' },
    { id: 'tag-11', name: 'Tag 11', color: 'bg-sky-400 border-2 !border-sky-400' },
    { id: 'tag-12', name: 'Tag 12', color: 'bg-blue-400 border-2 !border-blue-400' },
    { id: 'tag-13', name: 'Tag 13', color: 'bg-indigo-400 border-2 !border-indigo-400' },
    { id: 'tag-14', name: 'Tag 14', color: 'bg-violet-400 border-2 !border-violet-400' },
    { id: 'tag-15', name: 'Tag 15', color: 'bg-purple-400 border-2 !border-purple-400' },
    { id: 'tag-16', name: 'Tag 16', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
    { id: 'tag-17', name: 'Tag 17', color: 'bg-pink-400 border-2 !border-pink-400' },
    { id: 'tag-18', name: 'Tag 18', color: 'bg-rose-400 border-2 !border-rose-400' },
  ]

  let radioButtonValue: IOptionUI | null = $state({ id: '7', name: 'B7', color: 'bg-cyan-400 border-2 !border-cyan-400' })
  const handleRadioButton = (value: IOptionUI) => {
    console.log('ButtonGroup Value:', value)
    radioButtonValue = value
  }

  let packHeader: string = $state('GET')
  let packArgument: string = $state('ConfigList')
  let packValue: string = $state('{"3":"4"}')

  const testCrypto = () => {
    if (!packHeader || !packArgument) {
      return console.log(`Поле Header или Argument не может быть пустым`)
    }
    const parsedValue = JSON.parse(packValue)
    if (!parsedValue) {
      return console.error('Ошибка содержимого поля Value')
    }
    const EncryptResponse = EncryptWebSocketPacket(packHeader, packArgument, parsedValue) as Uint8Array
    const DecryptResponse = DecryptWebSocketPacket(new Uint8Array(EncryptResponse)) as IWebSocketPacket
    console.info('Encrypt Data:', EncryptResponse)
    console.info('Decrypt Data:', DecryptResponse)
  }

  // const handleProgressBar = (value: number) => {
  //   console.log('Slider Value:', value)
  //   sliderValue = value
  // }

  let progressBarValue: number = $state(50)
  /* Функция для уменьшения значения прогресс-бара */
  const decreaseProgressBar = () => {
    if (progressBarValue > 0) {
      progressBarValue -= 10
    }
  }
  const resetProgressBar = () => {
    progressBarValue = 50
  }
  const increaseProgressBar = () => {
    if (progressBarValue < 100) {
      progressBarValue += 10
    }
  }

  /* Начальное значение цвета */
  let colorValue = $state([150, 250, 50])
  const handleColorUpdate = (newColor: number[]) => {
    colorValue = newColor
  }

  /* Switch */
  let switchValue: boolean | null = $state(false)
  const toggleSwitch = (value: boolean | number) => {
    // console.log('toggleSwitch Value:', value)
    switchValue = !!value
  }
</script>

<div class="flex h-full flex-col items-center overflow-hidden overflow-y-visible">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
  </div>

  <div class="flex flex-wrap items-start justify-center">
    <Accordion id="acc1" label={{ text: 'Graph component (в разработке)' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: true }}>
      <Graph {data} width={800} label="График" xLabel="Время" yLabel="Значение" />
      <UIColorPicker id="ColorPicker" label={{ text: 'Test Color Picker' }} style={{ inlineStyle: 'width: 20rem; height: 14rem;' }} value={[255, 100, 0]} />
      <Separator style={{ visible: false }} />
      <UIButton
        id="button1"
        validation={{ text: 'Сохранить', disabled: true }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'green' }}
        onClick={() => counter++}
      />
    </Accordion>

    <Accordion id="acc9" label={{ text: 'Table component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <Table id="table" {rows} {columns} label={{ text: 'Устройства' }} style={{ width: '80%', color: 'blue' }} />
    </Accordion>

    <Accordion id="acc2" label={{ text: 'Пример использования: Настройки WiFi' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <UIButton
        id="button2"
        label={{ text: 'Режимы wifi' }}
        style={{ bgColor: 'blue', optionsWidth: 'max-option' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />

      <Accordion id="acc3" label={{ text: 'Настройки режима STA' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }} validation={{ initialState: true }}>
        <Select
          label={{ text: 'Точка доступа' }}
          value={ap}
          style={{ inlineStyle: 'width: 20rem;', color: 'white' }}
          validation={{ options: accessPoints, showCustomOption: false }}
          onUpdate={(value) => (selectValue = value)}
        />
        <Select
          label={{ text: 'Точка доступа' }}
          value={ap}
          style={{ inlineStyle: 'width: 30%;', color: 'green' }}
          validation={{ options: accessPoints, showCustomOption: true }}
          onUpdate={(value) => (selectValue = value)}
        />

        <UIInput
          id="sta-psk"
          label={{ text: 'Пароль' }}
          style={{ inlineStyle: 'width: 30%;' }}
          validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter password' }}
        />

        <Separator style={{ visible: false }} />

        <UISwitch
          id="ui-switch"
          label={{ text: 'Режим IP', captionLeft: 'Статический', captionRight: 'Динамический', color: 'purple' }}
          style={{ color: 'orange' }}
          onChange={(value) => {
            switchValue = value
          }}
        />
        <Separator style={{ visible: false }} />
        <UIInput
          label={{ text: 'IP Address' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-ip"
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
        />

        <UIInput
          label={{ text: 'Mask' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-ms"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />

        <UIInput
          label={{ text: 'Gateway' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-gw"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />
      </Accordion>

      <Accordion id="acc4" label={{ text: 'Настройки режима AP' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }} validation={{ initialState: true }}>
        <UIInput
          id="input-ap-ssid"
          label={{ text: 'Имя точки доступа' }}
          style={{ inlineStyle: 'width: 30%;', color: 'green' }}
          validation={{ type: 'text', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter string' }}
        />
        <UIInput
          id="input-ap-psk"
          label={{ text: 'Пароль точки доступа' }}
          style={{ inlineStyle: 'width: 30%;' }}
          validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter password' }}
        />

        <Separator style={{ visible: false }} />

        <UIInput
          label={{ text: 'IP Address' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-ip"
          validation={{
            type: 'text',
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
        />

        <UIInput
          label={{ text: 'Mask' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-ms"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />

        <UIInput
          label={{ text: 'Gateway' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-gw"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />
      </Accordion>
      <UIButton
        id="button2"
        validation={{ text: 'Сохранить' }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'green' }}
        onClick={() => counter++}
      />
      <UIButton
        id="button3"
        validation={{ text: 'Перезагрузить' }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'red' }}
        onClick={() => counter++}
      />
    </Accordion>

    <Accordion id="acc5" label={{ text: 'Button component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <div style="display: flex; flex-wrap: wrap; align-items: center;">
        <UIButton
          id="button4"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'blue', icon: UiIcon }}
          onClick={() => counter++}
        />
        <UIButton
          id="button5"
          style={{
            level_2: 'margin: 0.5rem; height: 5rem; width: 5rem; border-radius: 50%;',
            bgColor: 'primary',
            icon: UiIcon,
            iconProps: { height: '3rem', width: '3rem' },
          }}
          onClick={() => counter++}
        />
        <UIButton
          id="button6"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'white' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button7"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 6rem; margin: 0.5rem; border-radius: 0;', bgColor: 'amber' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button8"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 6rem; margin: 0.5rem; height: 4rem;', bgColor: 'red' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button9"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem; box-shadow: 0px 0px 10px red;', bgColor: 'orange' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button10"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'lime' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button11"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem; border-radius: 5px; border: 1px solid grey;', bgColor: 'green' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button12"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'sky' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button13"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'purple' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button14"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'pink' }}
          onClick={() => counter++}
        />
        <p style="flex: 1;">Kнопка нажата <strong>{counter}</strong> раз</p>
      </div>

      <UIButton
        id="button15"
        label={{ text: 'Режимы wifi (ширина по длинной опции)' }}
        style={{ bgColor: 'rose', optionsWidth: 'max-option', level_1: 'width: 60%' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />
      <p style="flex: 1;">Bыбранный режим: {buttonItem.name}</p>
      <Separator style={{ visible: false }} />

      <UIButton
        id="button16"
        label={{ text: 'Режимы wifi (автоматическая ширина)' }}
        style={{ bgColor: 'white', optionsWidth: 'auto' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />
    </Accordion>

    <Accordion id="acc6" label={{ text: 'Input component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <UIInput
        id="input-string"
        label={{ text: 'Поле ввода строки' }}
        style={{ inlineStyle: 'width: 60%;' }}
        validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
        bind:value={inputString}
        help={{ placeholder: 'Enter string' }}
      />
      <p style="margin-top: 0; width: 40%;">Введенная строка: {inputString}</p>
      <UIInput
        id="input-number"
        label={{ text: 'Поле ввода числа' }}
        style={{ inlineStyle: 'width: 20%;' }}
        validation={{ type: 'number' }}
        bind:value={inputNumber}
        help={{ placeholder: 'Enter number', info: 'Проблема в том, что груз задачи мешает работать. Мы ведь понимаем, что это надолго.' }}
      />
      <p style="margin-top: 0; width: 20%;">Введенное число: {inputNumber}</p>
      <Separator style={{ visible: false }} />

      <UIInput
        id="input-text"
        label={{ text: 'Поле ввода текста' }}
        style={{ inlineStyle: 'width: 50%;', rows: 5 }}
        validation={{ type: 'text-area', disabled: false }}
        bind:value={text}
        help={{ placeholder: 'Enter text', info: 'info about this input' }}
      />
      <p style="margin-top: 0; width: 40%;">Введенный текст: {text}</p>

      <Accordion id="acc7" label={{ text: 'File input' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }}>
        <FileInput
          id="default-file-input"
          label={{ text: 'Upload document' }}
          style={{ inlineStyle: 'width: 60%;' }}
          validation={{ accept: '.pdf,.doc,.docx' }}
        />
        <FileInput
          id="image-file-input"
          validation={{ type: 'image', accept: 'image/*' }}
          style={{ inlineStyle: 'width: 30%;' }}
          label={{ text: 'Profile picture' }}
        />
      </Accordion>
    </Accordion>

    <Accordion id="acc8" label={{ text: 'Slider component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: true }}>
      <!-- vertical -->
      <UISlider
        label={{ text: 'Цвета по умолчанию' }}
        validation={{ value: 800, min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'height: 20rem;', orientation: 'vertical' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        label={{ text: 'label' }}
        validation={{ value: [100, 500], min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'height: 20rem;', orientation: 'vertical', thumbColor: 'purple', showStepButtons: true, sliderColor: 'sky' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        validation={{ value: [100, 500], min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'height: 10rem;', orientation: 'vertical' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        validation={{ value: 800, min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'height: 20rem;', orientation: 'vertical', thumbColor: 'orange', showStepButtons: true, sliderColor: 'amber' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <Separator style={{ visible: false }} />

      <!-- horizontal -->
      <UISlider
        validation={{ value: [500, 600], min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'width: 20rem;', orientation: 'horizontal' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        validation={{ value: 150, min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'width: 20rem;', thumbColor: 'green', sliderColor: 'lime', showStepButtons: true }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <Separator style={{ visible: false }} />

      <UISlider
        validation={{ value: [500, 1000], min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'width: 30rem;', orientation: 'horizontal', showStepButtons: true, sliderColor: 'sky' }}
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        label={{ text: 'label', color: 'green' }}
        validation={{ value: 800, min: 50, max: 1200, step: 10 }}
        style={{ inlineStyle: 'width: 12rem;', thumbColor: 'rose', sliderColor: 'red' }}
        onUpdate={(value) => (sliderValue = value)}
      />
    </Accordion>

    <Accordion id="acc10" label={{ text: 'Еще что то' }} style={{ inlineStyle: 'width: 40%; margin: 1rem;' }} validation={{ initialState: false }}></Accordion>
    <Accordion id="acc11" label={{ text: 'Еще что то' }} style={{ inlineStyle: 'width: 40%; margin: 1rem;' }} validation={{ initialState: false }}></Accordion>
  </div>

  <ButtonGroup
    id="TestButtonGroup-1"
    label="Component - ButtonGroup"
    className="m-4"
    options={RadioGroupOption}
    value={radioButtonValue}
    onChange={handleRadioButton}
    props={{ disabled: false }}
  />

  <ButtonGroup
    id="TestButtonGroup-2"
    label="Default Tags"
    className="m-4"
    options={DEFAULT_TAGS}
    value={radioButtonValue}
    onChange={handleRadioButton}
    props={{ disabled: false }}
  />

  <br />

  <div class="flex flex-row">
    <Input id="TestInputHeader" bind:value={packHeader} props={{ autocomplete: 'on', maxLength: 8 }} className="m-1" />
    <Input id="TestInputArgument" bind:value={packArgument} props={{ autocomplete: 'on', maxLength: 16 }} className="m-1" />
    <Input id="TestInputValue" bind:value={packValue} props={{ autocomplete: 'on', maxLength: 32 }} className="m-1" />
    <Button onClick={testCrypto} label="Отправить" props={{ bgColor: 'bg-lime-200' }} className="m-1 w-40 rounded-2xl" />
  </div>

  <br />

  <ProgressBar id="testProgressBar" label="Component - ProgressBar" className="" bind:value={progressBarValue} />
  <div class="mt-4 flex">
    <Button onClick={decreaseProgressBar} label="-10" className="m-1" />
    <Button onClick={resetProgressBar} label="Сбросить" className="m-1" />
    <Button onClick={increaseProgressBar} label="+10" className="m-1" />
  </div>

  <br />

  <ColorPicker id="ColorPicker" label="Test Color Picker" className="w-full" bind:value={colorValue} onUpdate={handleColorUpdate} />

  <br />

  <Switch id="Switch" label="Test Switch" value={switchValue} className="" onUpdate={toggleSwitch} />

  <Separator style={{ visible: false }} />
</div>

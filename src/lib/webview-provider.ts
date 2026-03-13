import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { StorageService } from '../storage'
import { TestStatus, ImportJson } from '../types'
import { getWebviewHtml } from '../webview/html'

export class TestChecklistProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ticktest.panel'

  private _view?: vscode.WebviewView

  constructor(
    private extensionUri: vscode.Uri,
    private extensionPath: string,
    private storage: StorageService
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }

    this._updateWebview()

    webviewView.webview.onDidReceiveMessage((msg) => this._handleMessage(msg))
  }

  refresh(): void {
    this._updateWebview()
  }

  private _updateWebview(): void {
    if (!this._view) return

    const tasks = this.storage.getAllTasks()
    const template = this._loadTemplate()

    this._view.webview.html = getWebviewHtml(this._view.webview, tasks, template)
  }

  private _loadTemplate(): string {
    try {
      const templatePath = path.join(this.extensionPath, 'TEMPLATE.json')
      return fs.readFileSync(templatePath, 'utf-8')
    } catch {
      return '{}'
    }
  }

  private async _handleMessage(msg: any): Promise<void> {
    switch (msg.command) {
      case 'createTask': {
        this.storage.createTask(msg.taskId, msg.taskName || '')
        break
      }
      case 'deleteTask': {
        this.storage.deleteTask(msg.taskId)
        break
      }
      case 'addGroup': {
        this.storage.addGroup(msg.taskId, msg.name)
        break
      }
      case 'deleteGroup': {
        this.storage.deleteGroup(msg.taskId, msg.groupId)
        return // webview já atualizou localmente
      }
      case 'addTest': {
        this.storage.addTest(msg.taskId, msg.groupId, msg.description)
        return // webview já atualizou localmente
      }
      case 'deleteTest': {
        this.storage.deleteTest(msg.taskId, msg.groupId, msg.testId)
        return // webview já atualizou localmente
      }
      case 'updateTestStatus': {
        this.storage.updateTestStatus(msg.taskId, msg.testId, msg.status as TestStatus)
        return // não reconstruir HTML — webview já atualizou localmente
      }
      case 'updateTestNotes': {
        this.storage.updateTestNotes(msg.taskId, msg.testId, msg.notes)
        return // não reconstruir HTML — webview já atualizou localmente
      }
      case 'requestCreateTask': {
        const taskId = await vscode.window.showInputBox({ prompt: 'ID da tarefa (ex: RH-5321)', placeHolder: 'RH-XXXX' })
        if (!taskId?.trim()) return
        const taskName = await vscode.window.showInputBox({ prompt: 'Nome da tarefa (opcional)', placeHolder: '' }) || ''
        const id = taskId.trim().toUpperCase()
        this.storage.createTask(id, taskName.trim())
        this._view?.webview.postMessage({ command: 'taskCreated', taskId: id, taskName: taskName.trim() })
        this._updateWebview()
        return
      }
      case 'requestAddGroup': {
        const name = await vscode.window.showInputBox({ prompt: 'Nome do grupo de testes' })
        if (!name?.trim()) return
        const group = this.storage.addGroup(msg.taskId, name.trim())
        if (group) {
          this._view?.webview.postMessage({ command: 'groupCreated', taskId: msg.taskId, groupId: group.id, name: name.trim() })
        }
        this._updateWebview()
        return
      }
      case 'importJson': {
        try {
          const parsed = JSON.parse(msg.json) as ImportJson
          delete (parsed as any)['$instructions']
          delete (parsed as any)['$schema']

          const taskId = msg.taskId
          let task = this.storage.getTask(taskId)
          if (!task) {
            task = this.storage.createTask(taskId, parsed.taskName || '')
          }

          const result = this.storage.importToTask(taskId, parsed, msg.mode || 'replace')
          if (typeof result === 'string') {
            this._view?.webview.postMessage({ command: 'importError', error: result })
            return
          }
        } catch (e: any) {
          this._view?.webview.postMessage({ command: 'importError', error: `JSON inválido: ${e.message}` })
          return
        }
        break
      }
      default:
        return
    }

    this._updateWebview()
  }
}

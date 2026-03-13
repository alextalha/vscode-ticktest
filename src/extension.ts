import * as vscode from 'vscode'
import { exec } from 'child_process'
import { StorageService } from './storage'
import { TestChecklistProvider } from './lib/webview-provider'

export function activate(context: vscode.ExtensionContext) {
  const storage = new StorageService(context.extensionPath)
  const provider = new TestChecklistProvider(context.extensionUri, context.extensionPath, storage)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TestChecklistProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('ticktest.addTask', async () => {
      const taskId = await vscode.window.showInputBox({
        prompt: 'ID da tarefa (ex: RH-5321)',
        placeHolder: 'RH-XXXX',
      })
      if (!taskId?.trim()) return

      const taskName = await vscode.window.showInputBox({
        prompt: 'Nome da tarefa (opcional)',
        placeHolder: 'Ex: Compare Products Component',
      })

      storage.createTask(taskId.trim().toUpperCase(), taskName?.trim() || '')
      provider.refresh()
      vscode.window.showInformationMessage(`Tarefa ${taskId.trim().toUpperCase()} criada!`)
    }),

    vscode.commands.registerCommand('ticktest.detectTask', () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Nenhum workspace aberto')
        return
      }

      exec('git branch --show-current', { cwd: workspaceFolder.uri.fsPath }, (err, stdout) => {
        if (err) {
          vscode.window.showErrorMessage('Não foi possível ler a branch atual')
          return
        }

        const branch = stdout.trim()
        const match = branch.match(/RH-\d+/i)

        if (!match) {
          vscode.window.showInformationMessage(`Branch "${branch}" não contém padrão RH-XXXX`)
          return
        }

        const taskId = match[0].toUpperCase()
        if (!storage.getTask(taskId)) {
          storage.createTask(taskId, '')
          vscode.window.showInformationMessage(`Tarefa ${taskId} criada a partir da branch`)
        }

        provider.refresh()
      })
    })
  )
}

export function deactivate() {}
